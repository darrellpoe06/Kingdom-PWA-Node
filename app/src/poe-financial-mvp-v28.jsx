import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, Bar, BarChart } from 'recharts';
import { MarketCard, PricingTier, CommunityPriorities, ModuleCard, SectionTitle, MetricCell } from './components/shared.jsx';

// =============================================================================
// SEED DATA — v7 adds events array
// =============================================================================
const SEED_DATA = {
  meta: { lastUpdated: '2026-05-17', monthOfData: 'May 2026', bufferTarget: 5000, bufferCurrent: 0, appVersion: '28.1', releaseLabel: 'MVP v1.5', releaseNote: 'Real Estate ops (lease · tenant contact · equipment · rooms) + Buffer Fund widget + Capex list. WCAG 2.1 AA holds across new fields.', moduleSlug: 'financial', taxStructure: { filing: 'joint-1040', scheduleC: ['e-tlc', 'e-poetech'], scheduleE: ['e-poeprops'], sCorpElected: [], withholdingCoversFederal: true, withholdingCoversState: true, state: 'IL', county: 'Champaign', propertyTaxEscrowed: true }},
  entities: [
    { id: 'e-personal', name: 'Personal (Darrell + Christina)', type: 'personal', notes: 'Joint household' },
    { id: 'e-poeprops', name: 'Poe Properties LLC', type: 'business', notes: '11 rental doors' },
    { id: 'e-poetech',  name: 'PoeTech LLC', type: 'business', notes: 'Tech consulting & products' },
    { id: 'e-tlc',      name: 'TLC Therapy Solutions LLC', type: 'business', notes: "Christina's MSW practice" },
  ],
  accounts: [
    { id: 'a-chase-pers-8168', entityId: 'e-personal', name: 'Chase Personal Checking', institution: 'Chase', type: 'checking', fragment: '...8168', balance: 4223 },
    { id: 'a-chase-pers-3322', entityId: 'e-personal', name: 'Chase Personal Checking 2', institution: 'Chase', type: 'checking', fragment: '...3322', balance: 1200 },
    { id: 'a-cc-amex-dp', entityId: 'e-personal', name: 'AMEX Darrell', institution: 'AMEX', type: 'credit', fragment: '...DP', balance: -19811 },
    { id: 'a-cc-chase-freedom', entityId: 'e-personal', name: 'Chase Freedom', institution: 'Chase', type: 'credit', fragment: '', balance: -12992 },
    { id: 'a-cc-chase-sapph', entityId: 'e-personal', name: 'Chase Sapphire', institution: 'Chase', type: 'credit', fragment: '', balance: -29948 },
    { id: 'a-poeprops-op', entityId: 'e-poeprops', name: 'Poe Props Operating', institution: 'TBD', type: 'checking', fragment: 'TBD', balance: 0 },
    { id: 'a-poetech-op', entityId: 'e-poetech', name: 'PoeTech Operating', institution: 'TBD', type: 'checking', fragment: 'TBD', balance: 0 },
    { id: 'a-poetech-cc', entityId: 'e-poetech', name: '1st Mid CC Business', institution: '1st Mid', type: 'credit', fragment: '...6281', balance: -7308 },
    { id: 'a-tlc-op', entityId: 'e-tlc', name: 'TLC Operating', institution: 'TBD', type: 'checking', fragment: 'TBD', balance: 0 },
  ],
  transactions: [
    { id: 't1', date: '2026-05-01', accountId: 'a-chase-pers-8168', amount: 500.00, description: 'Online Transfer from CHK ...8168', category: 'transfer', isTransfer: true },
    { id: 't5', date: '2026-05-04', accountId: 'a-chase-pers-8168', amount: 1150.00, description: 'Zelle from DELLORES TRACY (rent)', category: 'rental-income', entityOverride: 'e-poeprops' },
    { id: 't7', date: '2026-05-06', accountId: 'a-chase-pers-8168', amount: 2099.93, description: 'UIUC Payroll', category: 'salary' },
    { id: 't11', date: '2026-05-14', accountId: 'a-chase-pers-8168', amount: 2865.53, description: 'State of IL Payroll (Christina)', category: 'salary' },
    { id: 't13', date: '2026-05-15', accountId: 'a-chase-pers-8168', amount: 550.00, description: 'Zelle from DETASHA (rent)', category: 'rental-income', entityOverride: 'e-poeprops' },
  ],
  contractors1099: [
    { id: 'k1', direction: 'outbound', entityId: 'e-tlc', name: 'MSW Contractor 1', role: 'Licensed clinical contractor', ytdPaid: 8400, monthly: 2800, status: 'active' },
    { id: 'k2', direction: 'outbound', entityId: 'e-tlc', name: 'MSW Contractor 2', role: 'Licensed clinical contractor', ytdPaid: 7200, monthly: 2400, status: 'active' },
    { id: 'k3', direction: 'outbound', entityId: 'e-tlc', name: 'MSW Contractor 3', role: 'Licensed clinical contractor', ytdPaid: 6300, monthly: 2100, status: 'active' },
    // Round 10 fix — pipeline figures realigned to the Enterprise positioning
    // ($25K-$75K/mo retainers, $400-$800/hr senior rate). Old conservative
    // placeholders ($1.5K, $800, $1K) were leftover from a "side gig" framing
    // that contradicted the rest of the Dev/Ops messaging.
    { id: 'k4', direction: 'inbound', entityId: 'e-poetech', name: 'Federal Companies', role: 'Enterprise network architecture · OT-IT integration', ytdReceived: 0, monthlyExpected: 25000, status: 'pipeline' },
    { id: 'k5', direction: 'inbound', entityId: 'e-poetech', name: 'Mid-market churches · AV + streaming systems', role: 'Multi-site AV install + ongoing managed services retainer', ytdReceived: 0, monthlyExpected: 4500, status: 'pipeline' },
    { id: 'k6', direction: 'inbound', entityId: 'e-poetech', name: 'UIUC F&S (1099)', role: 'BAS / Siemens controls consulting — senior architect rate', ytdReceived: 0, monthlyExpected: 12000, status: 'possible' },
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
    { id: 'ro-msw-license', name: 'Christina MSW license renewal', amount: 208, frequency: 'biennial', nextDue: '2027-11-30', entityId: 'e-tlc', category: 'professional', enabled: true },
    { id: 'ro-ceu-msw', name: 'CEU costs (Christina MSW)', amount: 500, frequency: 'annual', nextDue: '2026-11-01', entityId: 'e-tlc', category: 'professional', enabled: true },
    { id: 'ro-state-farm', name: 'State Farm — home + auto', amount: 823, frequency: 'monthly', nextDue: '2026-06-01', entityId: 'e-personal', category: 'insurance', enabled: true },
  ],
  // Round 10 — incidents extended with ITSM urgency taxonomy. Old records
  // without these fields keep working; the storage migration backfills sane
  // defaults (status:'resolved' for past financial incidents, urgency:'incident').
  // Going forward, every issue created across the app (tenant not paying,
  // maintenance, prayer requests with action needed, etc.) flows through this
  // same shape so the Action Queue can show them in one consolidated view.
  incidents: [
    { id: 'in1', date: '2026-05-01', amount: 300.00, category: 'vehicle', entityId: 'e-personal', description: 'Tatmans Towing', urgency: 'incident', status: 'resolved', dueDate: '2026-05-01', resolvedAt: '2026-05-01' },
    { id: 'in3', date: '2026-05-06', amount: 500.00, category: 'property', entityId: 'e-poeprops', description: 'Animal Damage Control', urgency: 'incident', status: 'resolved', dueDate: '2026-05-09', resolvedAt: '2026-05-06' },
    { id: 'in5', date: '2026-05-13', amount: 363.00, category: 'medical', entityId: 'e-personal', description: 'Robert W Shafer Orthodontics', urgency: 'incident', status: 'resolved', dueDate: '2026-05-16', resolvedAt: '2026-05-13' },
    // Active items so the Action Queue renders something meaningful on first load.
    { id: 'in-tenant-late', date: '2026-05-15', amount: 850.00, category: 'tenant', entityId: 'e-poeprops', description: 'Tenant at 1508 Holly Hill behind on rent', urgency: 'incident', status: 'open', dueDate: '2026-05-18', linkedTo: { type: 'rental', id: 'r3' } },
    { id: 'in-hvac-down', date: '2026-05-16', amount: 0, category: 'maintenance', entityId: 'e-poeprops', description: '805 Apt 2 furnace blowing cold air', urgency: 'change', status: 'open', dueDate: '2026-05-16', linkedTo: { type: 'rental', id: 'r5' } },
  ],
  scopes: [
    // v28+ Example scope — visible in Projects > Scopes tab so users see what a
    // filled-out contractor agreement looks like before they write their first.
    {
      id: 'sc-example-roof-1508',
      templateType: 'property',
      templateName: 'Property Contractor',
      title: '1508 Holly Hill — Roof Replacement',
      entityId: 'e-poeprops',
      projectId: 'pr-example-4',
      contractorName: 'Tomas Reyes',
      contractorEmail: 'tomas@reyesroofing-cu.example',
      contractorPhone: '(217) 555-0119',
      scopeOfWork: 'Complete tear-off of existing 3-tab asphalt shingle roof at 1508 Holly Hill Dr, Champaign IL. Replace decking where needed (estimated 4 sheets). Install 30-year architectural shingles (CertainTeed Landmark or equivalent), new underlayment, ice & water shield on eaves and valleys, new pipe boots, new ridge vent, new drip edge. Haul off all debris. Final inspection walk with owner.',
      deliverables: '• Existing roof torn off to deck and disposed of\n• Replacement decking installed where rotted or soft\n• New underlayment + ice & water shield per Illinois code\n• 30-year architectural shingles installed manufacturer-spec\n• New pipe boots, ridge vent, drip edge\n• Site cleaned of nails, shingles, debris\n• Photos of each stage (decking, underlayment, finished)\n• Manufacturer warranty paperwork delivered to owner',
      materials: 'Reyes Roofing provides: shingles, underlayment, ice & water, drip edge, ridge vent, nails, pipe boots, dumpster, magnetic nail sweep.\nPoe Properties provides: power and water access during work.\nAny decking replacement beyond 4 sheets billed at $65/sheet supplied + installed.',
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
    { id: 'pr-example-1', title: 'PoeTech v1 Public Launch · Loved Ones cohort', startDate: '2026-05-16', endDate: '2026-09-30', status: 'active', domain: 'business-poetech', description: 'Foundation launch through Church of the Living God. Onboard first 100 founding families. Validate pricing tiers and core Financial module.', hoursPerWeek: 20, entityId: 'e-poetech', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-2', title: 'Christiana college transition', startDate: '2026-05-16', endDate: '2026-08-25', status: 'active', domain: 'family', description: 'Visits, paperwork, dorm prep, financial aid coordination, the goodbye conversations that matter.', hoursPerWeek: 4, entityId: 'e-personal', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-3', title: 'Sponsor outreach Q3 — first cohort', startDate: '2026-06-01', endDate: '2026-08-31', status: 'planning', domain: 'business-poetech', description: 'Reach out to Tier B + C targets. Sign 1 Module Sponsor + 2 Directory Partners by Sept. Per sponsorship-ops brief.', hoursPerWeek: 5, entityId: 'e-poetech', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-4', title: '1508 Holly Hill — resolve LATE rent', startDate: '2026-05-16', endDate: '2026-06-15', status: 'ending-soon', domain: 'business-poeprops', description: 'Tenant conversation, payment plan or escalation per scope. Recover $850 gap or transition unit.', hoursPerWeek: 3, entityId: 'e-poeprops', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-5', title: 'TLC — add 1-2 MSW contractors', startDate: '2026-06-01', endDate: '2026-09-15', status: 'planning', domain: 'business-tlc', description: 'Recruit through Christina\'s clinical network. New scope agreements. Onboard via Practice Operations. Each contractor = ~$2K/mo additional revenue.', hoursPerWeek: 4, entityId: 'e-tlc', createdAt: '2026-05-16T00:00:00.000Z' },
    { id: 'pr-example-6', title: 'Holy Spirit Integration Worldview · finish + KDP', startDate: '2026-05-16', endDate: '2026-11-30', status: 'active', domain: 'business-poetech', description: 'Complete the book. KDP submission. Print proof. Launch alongside Spiritual Life module.', hoursPerWeek: 6, entityId: 'e-poetech', createdAt: '2026-05-16T00:00:00.000Z' },
  ], // v17/v22: project timelines with start/end dates — workload coordination · examples to show usage
  subscriptions: [], // v18: recurring monthly purchases · cart · subscription audit
  feedback: [], // v24: tester feedback collection · MVP
  welcomeDismissed: false, // v24: first-run welcome panel
  checkoutIntents: [], // v28+ Session C: cart intents (tier selected, action taken)
  userTier: 'foundation', // v28+ free entry tier; flips when a paid subscription is processed
  inquiries: [
    { id: 'inq-ex1', firstName: 'Maya R.', contactMethod: 'phone', phone: '(217) 555-0142', interestArea: 'individual', hasInsurance: 'Y', preferredProvider: 'Christina Poe', bestTimeToCall: 'Weekday evenings', source: 'church', sourceDetail: 'COLG referral', notes: 'Seeking faith-integrated therapy, recommended by pastor.', status: 'new', receivedAt: '2026-05-14T14:30:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-14T14:30:00.000Z' }] },
    { id: 'inq-ex2', firstName: 'James T.', contactMethod: 'email', email: 'jt****@example.com', interestArea: 'couples', hasInsurance: 'unsure', preferredProvider: 'any', bestTimeToCall: 'Lunch hour', source: 'google', sourceDetail: 'Searched faith-based therapy Champaign', notes: 'Wife and I both want to try counseling.', status: 'attempting-contact', receivedAt: '2026-05-13T09:15:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-13T09:15:00.000Z' }, { status: 'attempting-contact', at: '2026-05-14T10:00:00.000Z' }] },
    { id: 'inq-ex3', firstName: 'Tasha W.', contactMethod: 'phone', phone: '(217) 555-0189', interestArea: 'family', hasInsurance: 'Y', preferredProvider: 'Sheronda Smith-Williams', bestTimeToCall: 'After 6pm', source: 'instagram', sourceDetail: 'TLC IG post', notes: 'Family conflict, three teens.', status: 'scheduled-intake', receivedAt: '2026-05-10T11:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-10T11:00:00.000Z' }, { status: 'contacted', at: '2026-05-11T15:00:00.000Z' }, { status: 'scheduled-intake', at: '2026-05-12T14:00:00.000Z', notes: 'Intake scheduled in Acuity for 5/19' }] },
    { id: 'inq-ex4', firstName: 'Marcus L.', contactMethod: 'phone', phone: '(217) 555-0201', interestArea: 'individual', hasInsurance: 'N', preferredProvider: 'any', bestTimeToCall: 'Morning', source: 'word-of-mouth', sourceDetail: 'Friend referral', notes: 'Self-pay, working through grief.', status: 'contacted', receivedAt: '2026-05-12T16:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-12T16:00:00.000Z' }, { status: 'contacted', at: '2026-05-13T11:00:00.000Z' }] },
    { id: 'inq-ex5', firstName: 'Rev. K.', contactMethod: 'email', email: 'pastor****@example.org', interestArea: 'consultation', hasInsurance: 'unsure', preferredProvider: 'Christina Poe', bestTimeToCall: 'Tuesdays', source: 'church', sourceDetail: 'Pastor at sister church', notes: 'Clinical consultation for congregant referrals.', status: 'scheduled-intake', receivedAt: '2026-05-08T13:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-08T13:00:00.000Z' }, { status: 'contacted', at: '2026-05-09T10:00:00.000Z' }, { status: 'scheduled-intake', at: '2026-05-10T09:00:00.000Z' }] },
    { id: 'inq-ex6', firstName: 'Aaliyah B.', contactMethod: 'phone', phone: '(217) 555-0234', interestArea: 'child', hasInsurance: 'Y', preferredProvider: 'Carolyn Nicole Johnson', bestTimeToCall: 'School hours', source: 'facebook', sourceDetail: 'TLC FB post about adolescent therapy', notes: '13yo daughter, anxiety + school refusal.', status: 'new', receivedAt: '2026-05-15T10:30:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-15T10:30:00.000Z' }] },
    { id: 'inq-ex7', firstName: 'Wendell S.', contactMethod: 'email', email: 'ws****@example.com', interestArea: 'individual', hasInsurance: 'Y', preferredProvider: 'any', bestTimeToCall: 'Anytime', source: 'website', sourceDetail: 'TLC contact form', notes: 'PTSD, Vet, prefer VA-accepting clinician.', status: 'scheduled-intake', receivedAt: '2026-05-09T08:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-09T08:00:00.000Z' }, { status: 'contacted', at: '2026-05-09T14:00:00.000Z' }, { status: 'scheduled-intake', at: '2026-05-10T11:00:00.000Z' }] },
    { id: 'inq-ex8', firstName: 'Lakeisha M.', contactMethod: 'phone', phone: '(217) 555-0267', interestArea: 'individual', hasInsurance: 'unsure', preferredProvider: 'Christina Poe', bestTimeToCall: 'Lunch', source: 'church', sourceDetail: 'COLG women\'s ministry', notes: 'Marriage difficulty, considering separation.', status: 'declined', receivedAt: '2026-05-06T15:00:00.000Z', statusHistory: [{ status: 'new', at: '2026-05-06T15:00:00.000Z' }, { status: 'contacted', at: '2026-05-07T10:00:00.000Z' }, { status: 'declined', at: '2026-05-08T16:00:00.000Z', notes: 'Husband not ready to participate' }] },
  ], // v9/v23: practice inquiries — Christina logs these · examples show realistic pipeline
  moduleInterest: {}, // v10: family signals interest in upcoming modules { moduleKey: ISO timestamp }
  inflows: {
    salaries: [
      { id: 'd-uiuc', who: 'Darrell', source: 'UIUC salary', expected: 4200, actual: 4200, entityId: 'e-personal' },
      { id: 'd-church', who: 'Darrell', source: 'Church stipend', expected: 480, actual: 480, entityId: 'e-personal' },
      { id: 'c-state', who: 'Christina', source: 'State (Guardianship)', expected: 5731, actual: 5731, entityId: 'e-personal' },
      { id: 'c-church', who: 'Christina', source: 'Church stipend', expected: 436, actual: 436, entityId: 'e-personal' },
      { id: 'c-tlc', who: 'Christina', source: 'TLC Therapy Solutions', expected: 2200, actual: 4283, entityId: 'e-tlc' },
    ],
    rentals: [
      { id: 'r1', name: '1508 Williamsburg', address: '1508 Williamsburg', city: 'Champaign', state: 'IL', tenantName: '', rent: 1100, actual: 1100, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 88000, rate: 6.50, monthlyPI: 556, escrow: 180, estimated: true } },
      { id: 'r2', name: '1513 Holly Hill', address: '1513 Holly Hill', city: 'Champaign', state: 'IL', tenantName: '', rent: 1100, actual: 1100, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 88000, rate: 6.50, monthlyPI: 556, escrow: 180, estimated: true } },
      { id: 'r3', name: '1508 Holly Hill', address: '1508 Holly Hill', city: 'Champaign', state: 'IL', tenantName: '', rent: 1400, actual: 550, status: 'late', entityId: 'e-poeprops', mortgage: { balance: 110000, rate: 6.50, monthlyPI: 695, escrow: 220, estimated: true } },
      { id: 'r4', name: '805 Apt 1', address: '805 Apt 1', city: 'Champaign', state: 'IL', tenantName: '', rent: 850, actual: 850, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r5', name: '805 Apt 2', address: '805 Apt 2', city: 'Champaign', state: 'IL', tenantName: '', rent: 950, actual: 950, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r6', name: '805 Apt 3', address: '805 Apt 3', city: 'Champaign', state: 'IL', tenantName: '', rent: 900, actual: 900, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r7', name: '805 Apt 4', address: '805 Apt 4', city: 'Champaign', state: 'IL', tenantName: '', rent: 1000, actual: 1000, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r8', name: '440 South Street', address: '440 South Street', city: 'Champaign', state: 'IL', tenantName: '', rent: 950, actual: 950, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 80000, rate: 6.50, monthlyPI: 506, escrow: 170, estimated: true } },
      { id: 'r9', name: '1003 Koehn', address: '1003 Koehn', city: 'Champaign', state: 'IL', tenantName: '', rent: 1250, actual: 1250, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 100000, rate: 6.50, monthlyPI: 632, escrow: 200, estimated: true } },
      { id: 'r10', name: '1213 Koehn', address: '1213 Koehn', city: 'Champaign', state: 'IL', tenantName: '', rent: 1200, actual: 1200, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 95000, rate: 6.50, monthlyPI: 600, escrow: 195, estimated: true } },
      { id: 'r11', name: '709 Commercial', address: '709 Commercial', city: 'Champaign', state: 'IL', tenantName: '', rent: 1000, actual: 1000, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 80000, rate: 6.50, monthlyPI: 506, escrow: 170, estimated: true } },
      // v28+ Personal residence — Talans Way. Mortgage figures are placeholder PITI; edit in Real Estate.
      { id: 'home-talans', name: '2111 Talans Way', address: '2111 Talans Way', city: 'Champaign', state: 'IL', zip: '', tenantName: '', propertyType: 'primary-home', rent: 0, actual: 0, status: 'owner-occupied', entityId: 'e-personal', mortgage: { balance: 0, rate: 0, monthlyPI: 2400, escrow: 223, estimated: true }, notes: 'Primary residence. Fill in mortgage balance + rate from your latest statement; PITI is roughly $2,623/mo.' },
    ],
  },
  outflows: { rentalMortgages: 7595, propertyUtilities: 2638, household: 2176, debtService: 8155, charitableGiving: 2700 },
  debts: [
    { id: 'd1', name: 'UMB', minPayment: 100, rate: 34.99, balance: 1563, entityId: 'e-personal' },
    { id: 'd2', name: 'Avant', minPayment: 30, rate: 30.0, balance: 967, entityId: 'e-personal' },
    { id: 'd3', name: 'Credit One', minPayment: 60, rate: 27.0, balance: 558, entityId: 'e-personal' },
    { id: 'd4', name: 'Synchrony', minPayment: 34, rate: 27.0, balance: 956, entityId: 'e-personal' },
    { id: 'd5', name: '1st Mid CC Biz', minPayment: 224, rate: 25.49, balance: 7308, entityId: 'e-poetech' },
    { id: 'd6', name: 'AMEX (small)', minPayment: 86, rate: 24.74, balance: 1608, entityId: 'e-personal' },
    { id: 'd7', name: 'UIECU', minPayment: 300, rate: 22.3, balance: 13102, flag: 'ATTACK FIRST', entityId: 'e-personal' },
    { id: 'd8', name: 'Chase', minPayment: 285, rate: 22.0, balance: 9948, entityId: 'e-personal' },
    { id: 'd9', name: 'Citi', minPayment: 34, rate: 22.0, balance: 600, entityId: 'e-personal' },
    { id: 'd10', name: 'Discover', minPayment: 215, rate: 18.0, balance: 8961, entityId: 'e-personal' },
    { id: 'd11', name: 'US Bank Biz', minPayment: 86, rate: 18.0, balance: 2000, entityId: 'e-poetech' },
    { id: 'd12', name: 'Busey', minPayment: 85, rate: 18.0, balance: 1920, entityId: 'e-personal' },
    { id: 'd13', name: 'Upgrade', minPayment: 644, rate: 14.0, balance: 18000, entityId: 'e-personal' },
    { id: 'd14', name: 'Figure', minPayment: 748, rate: 11.0, balance: 52000, entityId: 'e-personal' },
    { id: 'd15', name: 'Light Stream', minPayment: 603, rate: 10.0, balance: 18491, note: 'Ends 9/2028', entityId: 'e-personal' },
    { id: 'd16', name: 'AMEX (B)', minPayment: 124, rate: 9.99, balance: 3548, entityId: 'e-poetech' },
    { id: 'd17', name: 'AMEX', minPayment: 24, rate: 9.99, balance: 558, entityId: 'e-personal' },
    { id: 'd18', name: 'Empower', minPayment: 169, rate: 8.0, balance: 5000, entityId: 'e-personal' },
    { id: 'd19', name: 'Car payment', minPayment: 772, rate: 7.25, balance: 40544, entityId: 'e-personal' },
    { id: 'd20', name: 'Good Leap (solar)', minPayment: 485, rate: 2.0, balance: 102000, note: 'Leave alone — ends 2047', leaveAlone: true, entityId: 'e-personal' },
    { id: 'd21', name: 'SBA Loan', minPayment: 100, rate: 1.0, balance: 9000, note: 'Leave alone — ends 2050', leaveAlone: true, entityId: 'e-poetech' },
    { id: 'd22', name: 'Aunt Leah', minPayment: 250, rate: 0, balance: 3000, entityId: 'e-personal' },
    { id: 'd23', name: 'Affirm', minPayment: 200, rate: 0, balance: 1056, entityId: 'e-personal' },
    { id: 'd24', name: 'AMEX DP', minPayment: 650, rate: 0, balance: 18813, note: '0% × 36 months', entityId: 'e-personal' },
    { id: 'd25', name: 'COT CC Biz', minPayment: 905, rate: 0, balance: 9000, entityId: 'e-poetech' },
    { id: 'd26', name: 'Divvy CC Biz', minPayment: 300, rate: 0, balance: 6000, entityId: 'e-poetech' },
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
  // pricing. The original placeholders (e.g., Federal Companies at $1,500/mo
  // when Enterprise retainers are $25K-$75K/mo) made the pipeline look like a
  // side-gig instead of the senior-architect consulting practice the rest of
  // the page describes. Numbers below match the Services Portfolio bands:
  //   · Small Business retainer: $3K-$12K/mo
  //   · Enterprise retainer:     $25K-$75K/mo
  //   · Enterprise project rate: $400-$800/hr
  opportunities: [
    { id: 'o1', person: 'Family', skill: 'Property management', what: 'Self-manage 1508 Holly Hill turnover', monthly: 1400, hours: 0, status: 'Priority', flag: true },
    { id: 'o2', person: 'Family', skill: 'Rent collection', what: 'Recover 805 Apt 3 (or evict/re-rent)', monthly: 350, hours: 0, status: 'Priority', flag: true },
    { id: 'o3', person: 'Darrell', skill: 'Network / OT-IT', what: 'PoeTech client #1 (Federal Companies) · enterprise network architecture retainer', monthly: 25000, hours: 10, status: 'Pipeline', flag: true },
    { id: 'o4', person: 'Darrell', skill: 'PWA / React dev', what: 'Small-business PWA build contracts · $15K-$45K projects', monthly: 12000, hours: 15, status: 'Building' },
    { id: 'o5', person: 'Darrell', skill: 'BAS / Siemens', what: 'UIUC F&S consulting (1099) · senior architect rate', monthly: 12000, hours: 12, status: 'Possible' },
    { id: 'o6', person: 'Darrell', skill: 'Church tech', what: 'Multi-site church AV install + ongoing managed services', monthly: 4500, hours: 8, status: 'Pipeline' },
    { id: 'o7', person: 'Christina', skill: 'Therapy practice', what: 'Add 1-2 more MSW contractors', monthly: 2000, hours: 0, status: 'Decision' },
    { id: 'o8', person: 'Christina', skill: 'Guardianship', what: 'Speaking / training (community)', monthly: 500, hours: 2, status: 'Possible' },
    { id: 'o9', person: 'PoeTech Services', skill: 'Consulting + build', what: 'Warm Prospect A · Small-business package · 6-month engagement', monthly: 8000, hours: 12, status: 'Active conversation', flag: true },
    { id: 'o10', person: 'PoeTech Services', skill: 'Consulting + build', what: 'Warm Prospect B · Small-business package · 6-month engagement', monthly: 8000, hours: 12, status: 'Active conversation', flag: true },
    { id: 'o11', person: 'PoeTech Services', skill: 'Revenue share build', what: 'Equity-split engagement on warm prospect business', monthly: 5000, hours: 12, status: 'Possible structure' },
    { id: 'o12', person: 'Family Educators', skill: 'K-12 teaching online', what: 'Principal Family Member A — online tutoring for homeschool families', monthly: 3000, hours: 10, status: 'Interested', flag: true },
    { id: 'o13', person: 'Family Educators', skill: 'K-12 teaching online', what: 'Principal Family Member B — online tutoring + curriculum support', monthly: 3000, hours: 10, status: 'Interested', flag: true },
    { id: 'o14', person: 'Family Educators', skill: 'Special-needs support', what: 'Specialized homeschool support for bullied / special-needs kids', monthly: 2000, hours: 8, status: 'Build', flag: true },
    { id: 'o15', person: 'PoeTech Services', skill: 'Elder care platform', what: 'Elder Care Coordination — adult children managing aging parents', monthly: 2500, hours: 6, status: 'Possible market' },
    { id: 'o16', person: 'PoeTech Services', skill: 'Caregiver marketplace', what: 'Elder Care 1099 caregiver platform — Care.com alternative', monthly: 4000, hours: 10, status: 'Vision · large market' },
    { id: 'o17', person: 'Poe Properties', skill: 'Ethical home acquisition', what: 'Home Legacy Program — purchase from elderly with no heirs (with attorney + integrity)', monthly: 0, hours: 4, status: 'Relationship building' },
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
    name: 'The Church Of The Living God',
    nickname: 'The Love Corner',
    site: 'https://www.thechurchofthelivinggod.com/',
    address: '312 E. Bradley Ave, Champaign, IL 61820 (Rear Door E)',
    phone: '217-359-6920',
    officeHours: 'Mon–Fri · 11:00 am – 6:00 pm',
    contactEmail: '', // intentionally blank — site uses an obfuscated link, user can fill in
    services: [
      { id: 'svc-sun', day: 'Sunday',    time: '11:00 AM', label: 'Worship Experience', online: true },
      { id: 'svc-wed1', day: 'Wednesday', time: '1:00 PM', label: 'Bible Study',         online: true },
      { id: 'svc-wed2', day: 'Wednesday', time: '6:00 PM', label: 'Bible Study',         online: true },
    ],
    media: {
      youtube:   'https://www.youtube.com/channel/UC821pJh7YR5llBNnWUJj-ZA',
      facebook:  'https://www.facebook.com/lovecornerlive/',
      instagram: 'https://www.instagram.com/tlcexperience/',
      broadcast: 'https://www.thechurchofthelivinggod.com/broadcast.html',
    },
    links: {
      give:        'https://www.thechurchofthelivinggod.com/tithesofferinggifts.html',
      giversCreed: 'https://www.thechurchofthelivinggod.com/givers-creed.html',
      calendar:    'https://www.thechurchofthelivinggod.com/calendar.html',
      ministries:  'https://www.thechurchofthelivinggod.com/ministry-opportunities.html',
      bibleChallenge: 'https://www.thechurchofthelivinggod.com/bible-reading-challenge-2026.html',
      classPoints: 'https://www.thechurchofthelivinggod.com/bible-study-class-points.html',
      lettersFromBG: 'https://www.thechurchofthelivinggod.com/letters-from-bg1.html',
      stayConnected: 'https://www.thechurchofthelivinggod.com/stay-connected.html',
      about: 'https://www.thechurchofthelivinggod.com/about-us.html',
      assembly: 'https://www.thechurchofthelivinggod.com/77th-national-assembly.html',
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
    numbersConfigured: 2, // Poe Properties + PoeTech in Phase 1
    budgetAlertMonthly: 30, // dollars — surface a warning at this threshold
  },
  // v28+ MVP v1.5 round 6 — Dev/Ops skill profiles. Each profile feeds the
  // opportunity matcher. Seeded from the existing `opportunities[]` so the
  // matcher renders something meaningful on first load.
  skillProfiles: [
    { id: 'sp-darrell',  name: 'Darrell',  skills: 'network architecture, OT-IT, BAS, Siemens, PWA, React, javascript, church AV, streaming, real estate, property management', hoursPerWeek: 20, monthlyIncome: 4680, location: 'Champaign, IL', techComfort: 5, notes: 'PoeTech LLC tech consulting · Poe Properties self-mgmt · Church of the Living God AV' },
    { id: 'sp-christina',name: 'Christina',skills: 'therapy, clinical, LCSW, MSW, faith, christian counseling, music, choir, vocal, guardianship, social work', hoursPerWeek: 30, monthlyIncome: 6167, location: 'Champaign, IL', techComfort: 3, notes: 'TLC Therapy Solutions LLC owner · Church of the Living God Choir Director' },
    { id: 'sp-twin-son', name: 'Twin (son)', skills: 'tech support, networking, teen, neighborhood, lawn care', hoursPerWeek: 4, monthlyIncome: 0, location: 'Champaign, IL', techComfort: 4, notes: 'Apprenticeship in progress — Cable Scout curriculum + neighborhood route' },
    { id: 'sp-twin-dau', name: 'Twin (daughter)', skills: 'teaching, tutoring, teen, community, pet sitting', hoursPerWeek: 4, monthlyIncome: 0, location: 'Champaign, IL', techComfort: 3, notes: 'Discovering — possible tutoring + pet care' },
  ],
};

// =============================================================================
// SCOPE TEMPLATES
// =============================================================================
const SCOPE_TEMPLATES = [
  { id: 'tmpl-msw', name: 'MSW Clinical Contractor', type: 'clinical', description: 'For licensed clinical contractors joining TLC Therapy Solutions', entityId: 'e-tlc',
    defaults: { title: 'Clinical Contractor Agreement', scopeOfWork: 'Provide licensed clinical mental health services to assigned clients of TLC Therapy Solutions LLC.', deliverables: '• Documented clinical sessions within 48 hours\n• Monthly caseload report\n• Quarterly case review participation', materials: 'TLC provides: EHR access, billing infrastructure, referral pipeline.\nContractor provides: Personal LCSW license, individual malpractice coverage.', schedule: 'Minimum 15 client hours/week. Maximum 30/week.', paymentTerms: '60/40 split. Paid bi-monthly via 1099. W-9 required.', acceptanceCriteria: 'Sessions documented per Illinois LCSW standards.', requirements: '• Active Illinois LCSW license\n• Individual professional liability insurance\n• W-9 on file\n• HIPAA training current', warranty: 'Services meet Illinois LCSW standards of care.', terminationClause: '30-day notice from either party.' }},
  { id: 'tmpl-prop', name: 'Property Contractor', type: 'property', description: 'For tradespeople servicing Poe Properties LLC rentals', entityId: 'e-poeprops',
    defaults: { title: 'Property Service Agreement', scopeOfWork: '[Describe specific work — what gets done, where, with what materials]', deliverables: '• Work meeting Illinois code\n• Photos of completed work\n• Final walkthrough', materials: '[Specify who provides what]', schedule: 'Start: [date]. Completion: [date].', paymentTerms: '50% deposit upon acceptance. 50% upon completion. Paid via 1099 if > $600/yr.', acceptanceCriteria: 'Work passes inspection. All systems function.', requirements: '• Active Illinois trade license\n• General liability insurance $1M+\n• W-9 on file', warranty: 'Labor warranty: 1 year. Materials per manufacturer.', terminationClause: '7 days written notice with cure opportunity.' }},
  { id: 'tmpl-blank', name: 'Custom Scope (blank)', type: 'custom', description: 'Start from scratch', entityId: 'e-personal', defaults: { title: 'Service Agreement', scopeOfWork: '', deliverables: '', materials: '', schedule: '', paymentTerms: '', acceptanceCriteria: '', requirements: '', warranty: '', terminationClause: '' }},
];

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
const PROJECT_DOMAINS = [
  { key: 'personal', label: 'Personal', color: '#5A6E3D' },
  { key: 'family', label: 'Family', color: '#B85838' },
  { key: 'friends', label: 'Friends · Community', color: '#8B6F47' },
  { key: 'church', label: 'Church · Ministry', color: '#7A5A8E' },
  { key: 'business-poetech', label: 'PoeTech', color: '#1A1815' },
  { key: 'business-poeprops', label: 'Poe Properties', color: '#5A4A2E' },
  { key: 'business-tlc', label: 'TLC Therapy', color: '#3E6E78' },
  { key: 'business-uiuc', label: 'UIUC · Day Job', color: '#4A4A4A' },
  { key: 'tech', label: 'Tech · Repair · Build', color: '#2A5A8E' },
  { key: 'other', label: 'Other', color: '#5A5751' },
];
// Round 11 — Added 'tbd' (to be decided). When auto-creating a project would
// push the family over their available hours/week, the new project lands here
// as a parking lot until capacity opens up or the user explicitly promotes it.
// TBD projects DON'T count toward workload forecast or Action Queue.
const PROJECT_STATUSES = ['planning', 'active', 'ending-soon', 'complete', 'on-hold', 'tbd'];
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
  'family':       'Family ($89/mo)',
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
const fmtPct = (n) => n == null ? '—' : `${n.toFixed(1)}%`;
const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(d, offset) { const x = new Date(d.getFullYear(), d.getMonth() + offset, 1); return `${MONTHS_ABBR[x.getMonth()]} '${String(x.getFullYear()).slice(2)}`; }
function yearsAndMonths(months) { const y = Math.floor(months / 12); const m = months % 12; if (y === 0) return `${m}mo`; if (m === 0) return `${y}yr`; return `${y}yr ${m}mo`; }

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
function frequencyToMonthly(amount, frequency) { switch (frequency) { case 'monthly': return amount; case 'quarterly': return amount / 3; case 'semi-annual': return amount / 6; case 'annual': return amount / 12; case 'biennial': return amount / 24; default: return 0; } }
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

function projectDebt(debts, monthlyExtraAvailable, currentDate, maxMonths = 240) {
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
function projectDebtSnowball(debts, monthlyExtra, sortOrder, currentDate, maxMonths = 360) {
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
function projectDebtMinimumOnly(debts, currentDate, maxMonths = 600) {
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


function projectRentalSnowball(rentals, monthlyExtra, sortOrder, currentDate, maxMonths = 240) {
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

function findExtraForTarget(rentals, targetYears, currentDate) {
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

export default function PoeFinancialSystem() {
  const [data, setData] = useState(SEED_DATA);
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

  useEffect(() => {
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
    (async () => { try { await window.storage.set('poe-financial-v28', JSON.stringify({ data, pressure, snowballSort, snowballExtra, debtSnowballSort, debtSnowballExtra, theme })); } catch (e) { console.error('Storage failed', e); } })();
  }, [data, pressure, snowballSort, snowballExtra, debtSnowballSort, debtSnowballExtra, theme, loaded]);

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
  const deleteProject = (id) => setData(d => ({ ...d, projects: (d.projects || []).filter(p => p.id !== id) }));
  const addSubscription = (item) => setData(d => ({ ...d, subscriptions: [...(d.subscriptions || []), { ...item, id: `sub-${Date.now()}`, createdAt: new Date().toISOString() }] }));
  const updateSubscription = (id, updates) => setData(d => ({ ...d, subscriptions: (d.subscriptions || []).map(s => s.id === id ? { ...s, ...updates } : s) }));
  const deleteSubscription = (id) => setData(d => ({ ...d, subscriptions: (d.subscriptions || []).filter(s => s.id !== id) }));
  // Feedback — seeded with lifecycle so the new → reviewed → planned → shipped flow has an audit trail.
  const addFeedback = (item) => setData(d => {
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
    return { ...d, feedback: [...(d.feedback || []), seeded] };
  });
  const deleteFeedback = (id) => setData(d => ({ ...d, feedback: (d.feedback || []).filter(f => f.id !== id) }));
  const dismissWelcome = () => setData(d => ({ ...d, welcomeDismissed: true }));
  const deleteRecurring = (id) => setData(d => ({ ...d, recurringObligations: d.recurringObligations.filter(r => r.id !== id) }));
  const deleteIncident = (id) => setData(d => ({ ...d, incidents: d.incidents.filter(i => i.id !== id) }));
  const deleteEvent = (id) => setData(d => ({ ...d, events: (d.events || []).filter(e => e.id !== id) }));
  // v28+ Session A: Accounts CRUD
  const addAccount = (item) => setData(d => ({ ...d, accounts: [...(d.accounts || []), { ...item, id: `a-${Date.now()}`, balance: parseFloat(item.balance) || 0 }] }));
  const updateAccount = (id, updates) => setData(d => ({ ...d, accounts: (d.accounts || []).map(a => a.id === id ? { ...a, ...updates, balance: updates.balance !== undefined ? parseFloat(updates.balance) || 0 : a.balance } : a) }));
  const deleteAccount = (id) => setData(d => ({ ...d, accounts: (d.accounts || []).filter(a => a.id !== id) }));
  // v28+ Session A: Transactions CRUD
  const addTransaction = (item) => setData(d => ({ ...d, transactions: [...(d.transactions || []), { ...item, id: `t-${Date.now()}`, amount: parseFloat(item.amount) || 0 }] }));
  const updateTransaction = (id, updates) => setData(d => ({ ...d, transactions: (d.transactions || []).map(t => t.id === id ? { ...t, ...updates, amount: updates.amount !== undefined ? parseFloat(updates.amount) || 0 : t.amount } : t) }));
  const deleteTransaction = (id) => setData(d => ({ ...d, transactions: (d.transactions || []).filter(t => t.id !== id) }));
  // v28+ Rentals expansion: Rental property CRUD
  const addRental = (item) => setData(d => ({ ...d, inflows: { ...d.inflows, rentals: [...(d.inflows.rentals || []), { ...item, id: `r-${Date.now()}` }] } }));
  const updateRental = (id, updates) => setData(d => ({ ...d, inflows: { ...d.inflows, rentals: (d.inflows.rentals || []).map(r => r.id === id ? { ...r, ...updates } : r) } }));
  const deleteRental = (id) => setData(d => ({ ...d, inflows: { ...d.inflows, rentals: (d.inflows.rentals || []).filter(r => r.id !== id) } }));
  const addScope = (scope) => setData(d => ({ ...d, scopes: [...d.scopes, { ...scope, id: `sc-${Date.now()}`, createdAt: new Date().toISOString(), status: 'draft' }] }));
  const deleteScope = (id) => setData(d => ({ ...d, scopes: d.scopes.filter(s => s.id !== id) }));
  const addInquiry = (item) => setData(d => ({ ...d, inquiries: [...(d.inquiries || []), { ...item, id: `inq-${Date.now()}`, receivedAt: new Date().toISOString(), status: 'new', statusHistory: [{ status: 'new', at: new Date().toISOString() }] }] }));
  // v28+ Session C: checkout intent logging
  const addCheckoutIntent = (item) => setData(d => ({ ...d, checkoutIntents: [...(d.checkoutIntents || []), { ...item, id: `ci-${Date.now()}`, at: new Date().toISOString() }] }));
  const deleteCheckoutIntent = (id) => setData(d => ({ ...d, checkoutIntents: (d.checkoutIntents || []).filter(i => i.id !== id) }));
  const updateInquiry = (id, updates) => setData(d => ({ ...d, inquiries: (d.inquiries || []).map(i => i.id === id ? { ...i, ...updates, statusHistory: updates.status && updates.status !== i.status ? [...(i.statusHistory || []), { status: updates.status, at: new Date().toISOString(), notes: updates.statusNotes }] : i.statusHistory } : i) }));
  const deleteInquiry = (id) => setData(d => ({ ...d, inquiries: (d.inquiries || []).filter(i => i.id !== id) }));
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
    // Excludes credit cards and loans (those are debts, not cash). Used by the
    // Debt Snowball "Baseline" affordance to anchor the slider in reality.
    const CASH_TYPES = ['checking','savings','cash','investment'];
    const allAccountsCash = (data.accounts || []).filter(a => CASH_TYPES.includes(a.type)).reduce((s, a) => s + (a.balance || 0), 0);
    return { salaryActual, rentalActual, rentalExpected, rentGap, collectionRate, totalInflow, totalOutflow, netCashFlow, totalConsumerDebt, totalRentalDebt, totalRentalPI, totalPersonalRealEstateDebt, totalPersonalRealEstatePI, totalOpportunity, totalOppHours, allAccountsCash };
  }, [data]);

  const reserves = useMemo(() => {
    const recurringMonthly = data.recurringObligations.filter(r => r.enabled && r.frequency !== 'monthly').reduce((s, r) => s + frequencyToMonthly(r.amount, r.frequency), 0);
    const taxItemsAnnual = data.taxCalendar.filter(t => t.applies && t.amount).reduce((s, t) => s + t.amount, 0);
    return { recurringMonthly, taxMonthly: taxItemsAnnual / 12, incidentMonthly: data.incidents.reduce((s, i) => s + i.amount, 0), totalMonthly: recurringMonthly + taxItemsAnnual / 12 + data.incidents.reduce((s, i) => s + i.amount, 0) };
  }, [data]);

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
  const entityRollups = useMemo(() => data.entities.map(entity => {
    const accounts = data.accounts.filter(a => a.entityId === entity.id);
    const isCash = (a) => ['checking','savings','cash','investment'].includes(a.type);
    const isCredit = (a) => a.type === 'credit' || a.type === 'loan';
    const cashBalance = accounts.filter(isCash).reduce((s, a) => s + (a.balance || 0), 0);
    const creditBalance = accounts.filter(isCredit).reduce((s, a) => s + (a.balance || 0), 0);
    const balance = accounts.reduce((s, a) => s + (a.balance || 0), 0); // legacy total
    const inflow = [...data.inflows.salaries.filter(s => s.entityId === entity.id).map(s => s.actual), ...data.inflows.rentals.filter(r => r.entityId === entity.id).map(r => r.actual)].reduce((s, x) => s + x, 0);
    const debts = data.debts.filter(d => d.entityId === entity.id);
    const debtBalance = debts.reduce((s, d) => s + d.balance, 0);
    return { entity, accounts, balance, cashBalance, creditBalance, inflow, debts, debtBalance };
  }), [data]);

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

      <header className="border-b border-[#1A1815] bg-[#FAF8F4] sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Round 14 fix — Title row stacks BELOW the controls on small/medium
              screens so the tier-preview dropdown and Subscribe/Feedback buttons
              can't crowd "Financial Control System." Side-by-side only on large
              screens where there's actually room. */}
          <div className="flex flex-col-reverse lg:flex-row lg:items-baseline lg:justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">PoeTech · Family OS</div>
              <h1 className="text-2xl sm:text-3xl leading-none truncate" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Financial Control System</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap lg:shrink-0 justify-end">
              {/* Round 5 — Tier indicator + dev-only switcher. Round 7 fix:
                  Replaced native <details> (which doesn't auto-close on outside
                  click and felt broken) with a controlled dropdown that closes
                  on selection and clicks outside, with a brief flash on change. */}
              <TierSwitcher userTier={data.userTier} setUserTier={setUserTier} />
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
                ['debts','Debts'],
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
                {[['entities','Entities'],['accounts','Accounts'],['transactions','Tx'],['cart','Cart'],['k1099','1099s'],['calendar','Calendar']].map(([id, label]) => (
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
        {view === 'overview' && <BigPictureDashboard totals={totals} pressure={pressure} setPressure={setPressure} pressureCalc={pressureCalc} projection={projection} rentalSnowball={rentalSnowball} flaggedRentals={flaggedRentals} flaggedOpportunities={flaggedOpportunities} entityRollups={entityRollups} reserves={reserves} upcomingEvents={upcomingEvents} welcomeDismissed={data.welcomeDismissed} dismissWelcome={dismissWelcome} setView={setView} setFeedbackOpen={setFeedbackOpen} bufferTarget={data.meta?.bufferTarget || 0} bufferCurrent={data.meta?.bufferCurrent || 0} setBufferCurrent={setBufferCurrent} capexItems={data.capexItems || []} watchlist={data.watchlist || []} rentals={data.inflows?.rentals || []} incidents={data.incidents || []} projects={data.projects || []} resolveIncident={resolveIncident} skillProfiles={data.skillProfiles || []} addIncident={addIncident} addProject={addProject} entities={data.entities || []} />}
        {view === 'books' && (
          <>
            {booksView === 'entities' && <BooksEntities entityRollups={entityRollups} entityFilter={entityFilter} setEntityFilter={setEntityFilter} data={data} />}
            {booksView === 'accounts' && <BooksAccounts entityRollups={entityRollups} entities={data.entities} addAccount={addAccount} updateAccount={updateAccount} deleteAccount={deleteAccount} bufferTarget={data.meta?.bufferTarget || 0} bufferCurrent={data.meta?.bufferCurrent || 0} setBufferCurrent={setBufferCurrent} setBufferTarget={setBufferTarget} totals={totals} />}
            {booksView === 'transactions' && <BooksTransactions data={data} entityFilter={entityFilter} setEntityFilter={setEntityFilter} currentDate={currentDate} addTransaction={addTransaction} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} />}
            {booksView === 'cart' && <Cart subscriptions={data.subscriptions || []} entities={data.entities} addSubscription={addSubscription} updateSubscription={updateSubscription} deleteSubscription={deleteSubscription} />}
            {booksView === 'k1099' && <ThousandNinetyNine contractors={data.contractors1099} />}
            {booksView === 'calendar' && <Calendar data={data} reserves={reserves} addRecurring={addRecurring} addIncident={addIncident} addEvent={addEvent} completeEvent={completeEvent} deleteRecurring={deleteRecurring} deleteIncident={deleteIncident} deleteEvent={deleteEvent} notifPermission={notifPermission} requestNotif={requestNotificationPermission} upcomingEvents={upcomingEvents} />}
          </>
        )}
        {view === 'inbound' && <Inbound voiceOps={data.voiceOps || {}} setVoiceOpsConfig={setVoiceOpsConfig} addIncident={addIncident} addInquiry={addInquiry} addProject={addProject} entities={data.entities || []} setView={setView} />}
        {view === 'debts' && <Debts debts={data.debts} entities={data.entities} debtSnowballSort={debtSnowballSort} setDebtSnowballSort={setDebtSnowballSort} debtSnowballExtra={debtSnowballExtra} setDebtSnowballExtra={setDebtSnowballExtra} debtSnowball={debtSnowball} debtMinOnly={debtMinOnly} currentDate={currentDate} netCashFlow={totals.netCashFlow} cashTotal={totals.allAccountsCash || 0} />}
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
              />
            </>
          );
        })()}
        {view === 'markets' && <Markets watchlist={data.watchlist || []} addWatchlistSymbol={addWatchlistSymbol} removeWatchlistSymbol={removeWatchlistSymbol} userTier={data.userTier} setView={setView} maxWatchlist={tierMeets(data.userTier, 'poetech-plus') ? Infinity : FOUNDATION_CAPS.maxWatchlistTickers} />}
        {view === 'church' && <Church church={data.church} prayerRequests={data.prayerRequests || []} addPrayerRequest={addPrayerRequest} markPrayerRequestSent={markPrayerRequestSent} deletePrayerRequest={deletePrayerRequest} addEvent={addEvent} />}
        {view === 'projects' && (tierMeets(data.userTier, VIEW_TIER_REQUIREMENTS.projects)
          ? <ProjectsWrapper projects={data.projects || []} scopes={data.scopes || []} entities={data.entities} contractors={data.contractors1099 || []} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addScope={addScope} deleteScope={deleteScope} capexItems={data.capexItems || []} addCapexItem={addCapexItem} updateCapexItem={updateCapexItem} deleteCapexItem={deleteCapexItem} netCashFlow={totals.netCashFlow} rentals={data.inflows?.rentals || []} accounts={data.accounts || []} />
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
            />
          : <UpgradePrompt viewLabel="Dev/Ops (personalized entrepreneurial options)" requiredTier={VIEW_TIER_REQUIREMENTS.opportunities} currentTier={data.userTier} setView={setView} setUserTier={setUserTier} />
        )}
        {view === 'about' && <About moduleInterest={data.moduleInterest || {}} toggleModuleInterest={toggleModuleInterest} theme={theme} setTheme={setTheme} feedback={data.feedback || []} deleteFeedback={deleteFeedback} checkoutIntents={data.checkoutIntents || []} addCheckoutIntent={addCheckoutIntent} deleteCheckoutIntent={deleteCheckoutIntent} addProject={addProject} />}

        <footer className="mt-16 pt-6 border-t border-[#E8E4DC] text-center print:hidden">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-2">PoeTech · A family data platform · {data.meta.releaseLabel || `v${data.meta.appVersion}`} · {data.meta.releaseNote || ''}</div>
          <button type="button" onClick={resetToSeed} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] underline underline-offset-4">Reset to seed data</button>
        </footer>
        {view !== 'overview' && view !== 'debts' && (data.userTier === 'foundation' || !data.userTier) && (
          <div className="mt-6">
            <AdvisementBanner />
          </div>
        )}
        {view === 'debts' && <TherapyReminder />}
      </main>
      <TTSControls />
      <InstallPrompt />
      <UpdatePrompt />
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
function SalesFooterBanner({ currentView, setView }) {
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
// BIG PICTURE — v7 dashboard horizontal-first
// =============================================================================
function BigPictureDashboard({ totals, pressure, setPressure, pressureCalc, projection, rentalSnowball, flaggedRentals, flaggedOpportunities, entityRollups, reserves, upcomingEvents, welcomeDismissed, dismissWelcome, setView, setFeedbackOpen, bufferTarget = 0, bufferCurrent = 0, setBufferCurrent, capexItems = [], watchlist = [], rentals = [], incidents = [], projects = [], resolveIncident, skillProfiles = [], addIncident, addProject, entities = [] }) {
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
  const bufferPct = bufferTarget > 0 ? Math.min(100, Math.round((bufferCurrent / bufferTarget) * 100)) : 0;
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
              <h2 className="text-2xl sm:text-3xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Welcome, Christina.</h2>
              <p className="text-base leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                This is the PoeTech Family OS — our family's stronghold for stewardship, work, and ministry made visible. Sample data is loaded so you can see how everything connects before importing real numbers.
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
                { icon: '🩺', label: 'Practice tab', desc: 'Your TLC pipeline · 8 sample inquiries · direct Acuity booking links' },
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
                <input id="aq-desc" autoFocus className="w-full p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="e.g., Furnace died at 805 Apt 4 · Replace front door lock · File quarterly taxes" value={queueForm.description} onChange={e => setQueueForm({ ...queueForm, description: e.target.value })} />
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
function Cart({ subscriptions, entities, addSubscription, updateSubscription, deleteSubscription }) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [subError, setSubError] = useState('');
  const [newSub, setNewSub] = useState({
    name: '', category: 'software', monthly: 0, status: 'keep',
    entityId: 'e-personal', notes: '', billingCycle: 'monthly'
  });

  const SUB_CATEGORIES = ['software', 'streaming', 'music', 'news', 'business', 'productivity', 'fitness', 'family', 'education', 'cloud-storage', 'other'];

  const submitSub = () => {
    if (!newSub.name || !newSub.monthly) {
      setSubError('Name and monthly amount are required.');
      return;
    }
    setSubError('');
    addSubscription({ ...newSub, monthly: parseFloat(newSub.monthly) });
    setNewSub({ name: '', category: 'software', monthly: 0, status: 'keep', entityId: 'e-personal', notes: '', billingCycle: 'monthly' });
    setShowForm(false);
  };

  const filtered = subscriptions.filter(s => filterStatus === 'all' || s.status === filterStatus);
  const active = subscriptions.filter(s => s.status !== 'cancelled');
  const totalMonthly = active.reduce((sum, s) => sum + s.monthly, 0);
  const reviewTotal = subscriptions.filter(s => s.status === 'review').reduce((sum, s) => sum + s.monthly, 0);
  const cancelTotal = subscriptions.filter(s => s.status === 'cancel').reduce((sum, s) => sum + s.monthly, 0);
  const potentialSavings = reviewTotal + cancelTotal;
  const annualSpend = totalMonthly * 12;
  const potentialAnnualSavings = potentialSavings * 12;

  const statusColor = (s) => s === 'keep' ? '#5A6E3D' : s === 'review' ? '#B85838' : s === 'cancel' ? '#8B6F47' : '#5A5751';
  const statusOptions = [
    { key: 'keep', label: '✓ Keep', desc: 'Worth it · necessary' },
    { key: 'review', label: '⚠ Review', desc: 'Not sure · check usage' },
    { key: 'cancel', label: '✗ Cancel', desc: 'Decided to cancel' },
    { key: 'cancelled', label: '— Cancelled', desc: 'Already done' },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Cart · Subscriptions Audit</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>What are you actually paying for every month?</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Every recurring purchase you have. See the total monthly bleed. Decide what to <strong>keep</strong>, what to <strong>review</strong>, and what to <strong>cancel</strong>. A simple audit reveals what's actually serving the family vs. what's just running in the background.
        </p>
      </section>

      {/* Summary metrics */}
      {subscriptions.length > 0 && (
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Active monthly" value={fmt(totalMonthly)} sub={`${active.length} subs`} small />
            <MetricCell label="Active annual" value={fmtCompact(annualSpend)} sub="/year" small accent="rust" />
            <MetricCell label="Potential savings" value={fmt(potentialSavings)} sub="/mo if cancelled" small accent="green" />
            <MetricCell label="Annual savings" value={fmtCompact(potentialAnnualSavings)} sub="/yr if cancelled" small accent="green" />
          </div>
          {potentialAnnualSavings > 0 && (
            <p className="text-xs text-[#5A6E3D] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Cancelling your "review" + "cancel" subs frees <strong>{fmt(potentialAnnualSavings)}/yr</strong>. That's real money you could redirect to the debt snowball.
            </p>
          )}
        </section>
      )}

      {/* Plaid integration future-build callout */}
      <section className="bg-white border-2 border-dashed border-[#B85838] p-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-1.5">🔌 Plaid Integration · Vision</div>
        <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Future build: Plaid bank account integration automatically detects recurring charges and adds them here for you to review. For now, add subscriptions manually as you find them — checking the last 90 days of bank/card statements is a great Saturday morning exercise. The local-first architecture means your transaction data stays on your device even when Plaid is added.
        </p>
      </section>

      {/* Filter + add */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Subscriptions</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {statusOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <button type="button" onClick={() => setShowForm(!showForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add subscription'}</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New subscription</div>
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Name (e.g., Netflix, Spotify, QuickBooks, Adobe)" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly cost</label>
                <input type="number" min="0" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="0.00" value={newSub.monthly} onChange={e => setNewSub({...newSub, monthly: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Billing cycle</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newSub.billingCycle} onChange={e => setNewSub({...newSub, billingCycle: e.target.value})}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (÷3 for monthly)</option>
                  <option value="annual">Annual (÷12 for monthly)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Category</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newSub.category} onChange={e => setNewSub({...newSub, category: e.target.value})}>
                  {SUB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newSub.entityId} onChange={e => setNewSub({...newSub, entityId: e.target.value})}>
                  <option value="e-personal">Personal</option><option value="e-poeprops">Poe Properties</option><option value="e-poetech">PoeTech</option><option value="e-tlc">TLC Therapy</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">Status</label>
              <div className="grid grid-cols-2 gap-1.5">
                {statusOptions.map(opt => (
                  <button key={opt.key} type="button" onClick={() => setNewSub({...newSub, status: opt.key})} className={`text-xs px-2 py-1.5 border text-left ${newSub.status === opt.key ? 'border-[#B85838] bg-[#FAF8F4] text-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-[9px]">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes (e.g., started Jan 2024, used weekly, kids use it)" value={newSub.notes} onChange={e => setNewSub({...newSub, notes: e.target.value})} />
            {subError && <div className="text-xs text-[#B85838] mb-2 px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{subError}</div>}
            <button type="button" onClick={submitSub} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Save Subscription</button>
          </div>
        )}

        {filtered.length === 0 && !showForm && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
              No subscriptions tracked yet. Start with the obvious ones — Netflix, Spotify, software, gym, news, cloud storage. Add them as you find them in bank statements. The audit becomes valuable when you see them all together.
            </p>
            <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              The average American family pays $273/mo across 12 subscriptions according to recent surveys — and 84% underestimate by 50%. The first audit is always eye-opening.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="bg-white border border-[#1A1815]">
            {filtered.sort((a,b) => b.monthly - a.monthly).map((s, i) => (
              <div key={s.id} className={`p-4 ${i < filtered.length - 1 ? 'border-b border-[#E8E4DC]' : ''} ${s.status === 'cancel' || s.status === 'review' ? 'bg-[#FAF8F4]' : ''}`}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">{s.category}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(s.monthly)}<span className="text-xs text-[#5A5751]">/mo</span></div>
                    <div className="text-[10px] text-[#5A5751]">{fmt(s.monthly * 12)}/yr</div>
                  </div>
                </div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {statusOptions.map(opt => (
                    <button key={opt.key} onClick={() => updateSubscription(s.id, { status: opt.key })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${s.status === opt.key ? 'border-[#1A1815] bg-[#1A1815] text-[#FAF8F4]' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`} style={s.status === opt.key ? {} : { color: statusColor(opt.key) }}>
                      {opt.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => { if (confirm('Delete this subscription record?')) deleteSubscription(s.id); }} className="text-[10px] px-2 py-1 text-[#5A5751] hover:text-[#B85838] uppercase tracking-wider">Delete</button>
                </div>
                {s.notes && <p className="text-xs text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

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
// =============================================================================
const CAPEX_STATUSES = ['planned','researching','wishlist','on-hold','purchased'];
const CAPEX_CATEGORIES = ['Networking','Tools','Storage','Home','Office','Vehicle','Software','Other'];

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
const URGENCY_KEYS = URGENCY_BANDS.map(u => u.key);
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
const SKILL_CATEGORIES = [
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

function ProjectInventory({ projects = [], entities = [], capexItems = [], addCapexItem, updateCapexItem, deleteCapexItem, netCashFlow = 0, rentals = [], accounts = [], compact = false }) {
  const blankCapex = () => ({
    category: 'Tools', name: '', description: '', link: '',
    priority: 3, cost: 0, neededBy: '', status: 'researching', notes: '',
    entityId: entities[0]?.id || 'e-personal', module: '', projectId: '',
    purchaseTargetDate: '',
    // Round 4 inventory extensions:
    //  · locationId — the property/site the item was bought FOR (drop from rentals)
    //  · purchasedFromAccountId — which account paid for it (drop from accounts)
    //  · make / model / serial — auto-prompted for traceability (warranty, theft, audit)
    locationId: '', purchasedFromAccountId: '',
    make: '', model: '', serial: '',
  });
  const [capexForm, setCapexForm] = useState(blankCapex());
  const [showCapexForm, setShowCapexForm] = useState(false);
  const [capexFilter, setCapexFilter] = useState('all');
  const [projFilter, setProjFilter] = useState('all'); // 'all' | 'unassigned' | projectId

  const visibleCapex = capexItems.filter(c => {
    if (capexFilter !== 'all' && c.status !== capexFilter) return false;
    if (projFilter === 'all') return true;
    if (projFilter === 'unassigned') return !c.projectId;
    return c.projectId === projFilter;
  });

  const capexTotalPlanned = capexItems.filter(c => c.status !== 'purchased').reduce((s, c) => s + (parseFloat(c.cost) || 0), 0);

  const submitCapex = () => {
    if (!capexForm.name) { alert('Item name is required.'); return; }
    addCapexItem && addCapexItem(capexForm);
    setCapexForm(blankCapex()); setShowCapexForm(false);
  };

  // 12-month forecast — bucket open (non-purchased) items by their target month.
  // Items without a target date land in an "Unscheduled" bucket so they're visible
  // but don't pollute the monthly cash math.
  const forecast = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: `${MONTHS_ABBR[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`, items: [], total: 0 });
    }
    let unscheduled = { key: 'unscheduled', label: 'Unscheduled', items: [], total: 0 };
    for (const c of capexItems) {
      if (c.status === 'purchased') continue;
      const cost = parseFloat(c.cost) || 0;
      if (!c.purchaseTargetDate) { unscheduled.items.push(c); unscheduled.total += cost; continue; }
      const d = new Date(c.purchaseTargetDate);
      if (isNaN(d.getTime())) { unscheduled.items.push(c); unscheduled.total += cost; continue; }
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find(m => m.key === key);
      if (bucket) { bucket.items.push(c); bucket.total += cost; }
      else if (d < now) {
        // Past-due target — surface in current month with overdue flag.
        months[0].items.push({ ...c, _overdue: true });
        months[0].total += cost;
      } else {
        unscheduled.items.push(c); unscheduled.total += cost;
      }
    }
    return { months, unscheduled };
  }, [capexItems]);

  // Per-item savings prompt — only for items with a target date and a positive
  // cost. Computes the required per-month set-aside based on months remaining.
  const today = new Date();
  const savingsPrompts = capexItems
    .filter(c => c.status !== 'purchased' && c.purchaseTargetDate && (parseFloat(c.cost) || 0) > 0)
    .map(c => {
      const target = new Date(c.purchaseTargetDate);
      const monthsLeft = Math.max(0, (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth()));
      const cost = parseFloat(c.cost) || 0;
      const perMonth = monthsLeft > 0 ? cost / monthsLeft : cost; // if 0 months left, lump sum needed now
      return { ...c, monthsLeft, perMonth };
    })
    .sort((a, b) => a.monthsLeft - b.monthsLeft || b.perMonth - a.perMonth);

  // Compact mode shows only the forecast + prompts summary, not the editor —
  // used when this component is embedded at the bottom of the Projects list.
  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';
  const projectLookup = Object.fromEntries(projects.map(p => [p.id, p]));

  return (
    <div className="space-y-6">
      {!compact && (
        <section className="bg-white border border-[#1A1815] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-medium">Project Inventory · Capital Forecast</div>
          <h2 className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Tools you need · when you'll buy them · whether the money will be there.</h2>
          <p className="text-sm leading-relaxed mt-2 text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Add equipment a project needs, give it a target purchase date, and the forecast below shows the month-by-month outflow against your current net cash flow. If a month doesn't pencil, the row turns amber so you know to push the date back or save harder before then.
          </p>
        </section>
      )}

      {/* Totals strip */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
          <MetricCell label="Items tracked" value={`${capexItems.length}`} small />
          <MetricCell label="Open spend" value={fmt(capexTotalPlanned)} sub="not yet purchased" small accent="rust" />
          <MetricCell label="Scheduled" value={`${capexItems.filter(c => c.purchaseTargetDate && c.status !== 'purchased').length}`} sub="have a target date" small />
          <MetricCell label="Net cash flow" value={fmt(netCashFlow)} sub="per mo · current" small accent={netCashFlow >= 0 ? 'green' : 'rust'} />
        </div>
      </section>

      {/* 12-month forecast — always visible, this is the heart of the feature */}
      <section aria-labelledby="forecast-h">
        <h3 id="forecast-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">12-Month Capital Forecast</h3>
        <div className="bg-white border border-[#1A1815] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[9px] uppercase tracking-wider text-[#5A5751] border-b border-[#1A1815] bg-[#FAF8F4]">
                <th scope="col" className="p-3">Month</th>
                <th scope="col" className="p-3 text-right">Projected outflow</th>
                <th scope="col" className="p-3 text-right">Gap vs net cash</th>
                <th scope="col" className="p-3">Items</th>
              </tr>
            </thead>
            <tbody>
              {forecast.months.map((m, i) => {
                const gap = netCashFlow - m.total;
                const short = m.total > 0 && gap < 0;
                return (
                  <tr key={m.key} className={`border-b border-[#E8E4DC] ${i % 2 === 1 ? 'bg-[#FAF8F4]' : ''}`} style={{ fontFamily: '"Fraunces", serif' }}>
                    <td className="p-3" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{m.label}</td>
                    <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: m.total > 0 ? 500 : 400 }}>
                      {m.total > 0 ? fmt(m.total) : <span className="text-[#5A5751]">—</span>}
                    </td>
                    <td className={`p-3 text-right ${short ? 'text-[#B85838] font-semibold' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {m.total > 0 ? (
                        <>
                          <span aria-hidden="true">{short ? '⚠ ' : '✓ '}</span>
                          <span className="sr-only">{short ? 'short by ' : 'covered, '}</span>
                          {fmt(gap)}
                        </>
                      ) : <span>—</span>}
                    </td>
                    <td className="p-3 text-xs">
                      {m.items.length === 0 ? <span className="text-[#5A5751]">—</span> : (
                        <div className="flex flex-wrap gap-1">
                          {m.items.map(it => (
                            <span key={it.id} className={`inline-flex items-baseline gap-1 px-2 py-0.5 border ${it._overdue ? 'border-[#B85838] text-[#B85838]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                              {it.name} <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {fmt(parseFloat(it.cost) || 0)}</span>
                              {it._overdue && <span className="text-[9px] uppercase tracking-wider">overdue</span>}
                              {it.projectId && projectLookup[it.projectId] && <span className="text-[9px] uppercase tracking-wider">· {projectLookup[it.projectId].title.slice(0, 20)}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {forecast.unscheduled.items.length > 0 && (
                <tr className="border-t-2 border-[#1A1815] bg-[#FAF8F4]" style={{ fontFamily: '"Fraunces", serif' }}>
                  <td className="p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Unscheduled</td>
                  <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(forecast.unscheduled.total)}</td>
                  <td className="p-3 text-right text-[10px] text-[#5A5751]">no target date set</td>
                  <td className="p-3 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {forecast.unscheduled.items.map(it => (
                        <span key={it.id} className="inline-flex items-baseline gap-1 px-2 py-0.5 border border-[#E8E4DC] text-[#5A5751]">{it.name} <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {fmt(parseFloat(it.cost) || 0)}</span></span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Each row compares projected outflows for that month against your <strong>current</strong> net cash flow ({fmt(netCashFlow)}/mo). Real net cash will shift with seasonality and rent collection — treat the gap column as a "talk about it now" signal, not a hard ledger.
        </p>
      </section>

      {/* Savings prompts */}
      {savingsPrompts.length > 0 && (
        <section aria-labelledby="prompts-h">
          <h3 id="prompts-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Savings Prompts · per item with a target date</h3>
          <div className="bg-white border border-[#1A1815]">
            {savingsPrompts.map((p, i, arr) => {
              const overdue = p.monthsLeft === 0;
              const stretch = !overdue && p.perMonth > Math.max(0, netCashFlow);
              const tag = overdue ? 'overdue · lump sum needed' : stretch ? 'tight at current net cash' : 'fits at current net cash';
              const accent = overdue ? 'text-[#B85838]' : stretch ? 'text-[#B85838]' : 'text-[#5A6E3D]';
              return (
                <div key={p.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`} style={{ fontFamily: '"Fraunces", serif' }}>
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm" style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="text-xs text-[#5A5751]">
                        {p.category} · target {p.purchaseTargetDate} · {fmt(parseFloat(p.cost) || 0)} total
                        {p.projectId && projectLookup[p.projectId] && <> · project: {projectLookup[p.projectId].title}</>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg ${accent}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
                        {overdue ? `${fmt(parseFloat(p.cost) || 0)} now` : `${fmt(p.perMonth)}/mo`}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{p.monthsLeft} month{p.monthsLeft === 1 ? '' : 's'} left</div>
                    </div>
                  </div>
                  <div className={`text-[10px] uppercase tracking-wider mt-2 ${accent}`}>
                    {overdue ? '⚠' : stretch ? '⚠' : '✓'} <span className="sr-only">{overdue ? 'overdue ' : stretch ? 'stretch ' : 'fits '}</span>{tag}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Per-item set-aside = remaining cost ÷ months until target date. If the per-item ask exceeds your monthly net, the row warns — either push the date, lower the cost, or raise net (cut discretionary, close the rent gap).
          </p>
        </section>
      )}

      {/* Item list + editor — only shown in full (non-compact) mode */}
      {!compact && (
        <section aria-labelledby="items-h">
          <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
            <h3 id="items-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Inventory Items · {capexItems.length}</h3>
            <button type="button" onClick={() => { setShowCapexForm(!showCapexForm); setCapexForm(blankCapex()); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showCapexForm ? '× Cancel' : '+ Add inventory item'}</button>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-1 mb-3 text-[10px] uppercase tracking-wider items-center">
            <span className="text-[#5A5751] mr-1">Status:</span>
            <button type="button" onClick={() => setCapexFilter('all')} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${capexFilter === 'all' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>All</button>
            {CAPEX_STATUSES.map(s => (
              <button key={s} type="button" onClick={() => setCapexFilter(s)} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${capexFilter === s ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{s}</button>
            ))}
            <span className="text-[#5A5751] mx-1">·</span>
            <span className="text-[#5A5751] mr-1">Project:</span>
            <button type="button" onClick={() => setProjFilter('all')} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${projFilter === 'all' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>Any</button>
            <button type="button" onClick={() => setProjFilter('unassigned')} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${projFilter === 'unassigned' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>Unassigned</button>
            {projects.map(p => (
              <button key={p.id} type="button" onClick={() => setProjFilter(p.id)} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${projFilter === p.id ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{p.title.slice(0, 24)}</button>
            ))}
          </div>

          {showCapexForm && (
            <div className="bg-white border border-[#B85838] p-3 mb-3 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label htmlFor="cx-cat" className={labelCls}>Category</label><select id="cx-cat" className={fieldCls} value={capexForm.category} onChange={e => setCapexForm({ ...capexForm, category: e.target.value })}>{CAPEX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="sm:col-span-3"><label htmlFor="cx-name" className={labelCls}>Item name</label><input id="cx-name" className={fieldCls} value={capexForm.name} onChange={e => setCapexForm({ ...capexForm, name: e.target.value })} /></div>
              </div>
              <div><label htmlFor="cx-desc" className={labelCls}>Description</label><input id="cx-desc" className={fieldCls} value={capexForm.description} onChange={e => setCapexForm({ ...capexForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label htmlFor="cx-pri" className={labelCls}>Priority (1–5)</label><input id="cx-pri" type="number" min="1" max="5" className={fieldCls} value={capexForm.priority} onChange={e => setCapexForm({ ...capexForm, priority: e.target.value })} /></div>
                <div><label htmlFor="cx-cost" className={labelCls}>Cost</label><input id="cx-cost" type="number" step="0.01" min="0" inputMode="decimal" className={fieldCls} value={capexForm.cost} onChange={e => setCapexForm({ ...capexForm, cost: e.target.value })} /></div>
                <div><label htmlFor="cx-target" className={labelCls}>Target purchase date</label><input id="cx-target" type="date" className={fieldCls} value={capexForm.purchaseTargetDate} onChange={e => setCapexForm({ ...capexForm, purchaseTargetDate: e.target.value })} /></div>
                <div><label htmlFor="cx-stat" className={labelCls}>Status</label><select id="cx-stat" className={fieldCls} value={capexForm.status} onChange={e => setCapexForm({ ...capexForm, status: e.target.value })}>{CAPEX_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><label htmlFor="cx-proj" className={labelCls}>Linked project (optional)</label><select id="cx-proj" className={fieldCls} value={capexForm.projectId} onChange={e => setCapexForm({ ...capexForm, projectId: e.target.value })}><option value="">— none —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                <div><label htmlFor="cx-ent" className={labelCls}>Entity</label><select id="cx-ent" className={fieldCls} value={capexForm.entityId} onChange={e => setCapexForm({ ...capexForm, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
                <div><label htmlFor="cx-need" className={labelCls}>Needed by (free text)</label><input id="cx-need" className={fieldCls} placeholder="ASAP / Soon / Later" value={capexForm.neededBy} onChange={e => setCapexForm({ ...capexForm, neededBy: e.target.value })} /></div>
              </div>
              {/* Round 4 — Location (for) + Purchased from account dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="cx-loc" className={labelCls}>Purchased FOR (location / property)</label>
                  <select id="cx-loc" className={fieldCls} value={capexForm.locationId} onChange={e => setCapexForm({ ...capexForm, locationId: e.target.value })}>
                    <option value="">— not assigned to a property —</option>
                    {rentals.map(r => <option key={r.id} value={r.id}>{r.name}{r.city ? ` · ${r.city}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="cx-acct" className={labelCls}>Purchased FROM (account that pays)</label>
                  <select id="cx-acct" className={fieldCls} value={capexForm.purchasedFromAccountId} onChange={e => setCapexForm({ ...capexForm, purchasedFromAccountId: e.target.value })}>
                    <option value="">— not specified —</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ` (${a.fragment})` : ''} · {a.type}</option>)}
                  </select>
                </div>
              </div>
              {/* Round 4 — Make / Model / Serial autoprompts for traceability */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><label htmlFor="cx-make" className={labelCls}>Make (brand)</label><input id="cx-make" className={fieldCls} placeholder="e.g., UniFi, Klein, Dell" value={capexForm.make} onChange={e => setCapexForm({ ...capexForm, make: e.target.value })} /></div>
                <div><label htmlFor="cx-model" className={labelCls}>Model #</label><input id="cx-model" className={fieldCls} placeholder="e.g., UCG-Max-NS" value={capexForm.model} onChange={e => setCapexForm({ ...capexForm, model: e.target.value })} /></div>
                <div><label htmlFor="cx-serial" className={labelCls}>Serial #</label><input id="cx-serial" className={fieldCls} placeholder="warranty / theft recovery" value={capexForm.serial} onChange={e => setCapexForm({ ...capexForm, serial: e.target.value })} /></div>
              </div>
              <div><label htmlFor="cx-link" className={labelCls}>Link (optional)</label><input id="cx-link" type="url" className={fieldCls} placeholder="https://..." value={capexForm.link} onChange={e => setCapexForm({ ...capexForm, link: e.target.value })} /></div>
              <div><label htmlFor="cx-notes" className={labelCls}>Notes</label><input id="cx-notes" className={fieldCls} value={capexForm.notes} onChange={e => setCapexForm({ ...capexForm, notes: e.target.value })} /></div>
              <button type="button" onClick={submitCapex} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save Inventory Item</button>
            </div>
          )}

          {visibleCapex.length === 0 ? (
            <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{capexItems.length === 0 ? 'No inventory items yet. Add the first one above.' : 'No items match this filter.'}</p>
          ) : (
            <div className="bg-white border border-[#1A1815]">
              {[...visibleCapex].sort((a, b) => (a.priority || 99) - (b.priority || 99) || (b.cost || 0) - (a.cost || 0)).map((c, i, arr) => (
                <div key={c.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>P{c.priority || '?'}</span>
                        <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">{c.category}</span>
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{c.name}</span>
                        {c.link && <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline">link →</a>}
                      </div>
                      {c.description && <div className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{c.description}</div>}
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-1">
                        {c.purchaseTargetDate && <>target {c.purchaseTargetDate}{c.projectId && projectLookup[c.projectId] ? ' · ' : ''}</>}
                        {c.projectId && projectLookup[c.projectId] && <>project: {projectLookup[c.projectId].title}</>}
                        {!c.purchaseTargetDate && !c.projectId && <span className="italic">unscheduled · unlinked</span>}
                      </div>
                      {/* Round 4 — location · account · make/model/serial breadcrumb */}
                      {(c.locationId || c.purchasedFromAccountId || c.make || c.model || c.serial) && (
                        <div className="text-[10px] text-[#5A5751] mt-1 space-x-2" style={{ fontFamily: '"Fraunces", serif' }}>
                          {c.locationId && rentals.find(r => r.id === c.locationId) && <span>📍 for <strong>{rentals.find(r => r.id === c.locationId).name}</strong></span>}
                          {c.purchasedFromAccountId && accounts.find(a => a.id === c.purchasedFromAccountId) && <span>💳 paid via <strong>{accounts.find(a => a.id === c.purchasedFromAccountId).name}</strong></span>}
                          {(c.make || c.model) && <span>🔖 {[c.make, c.model].filter(Boolean).join(' ')}</span>}
                          {c.serial && <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>S/N {c.serial}</span>}
                        </div>
                      )}
                      {c.notes && <div className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{c.notes}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{c.cost ? fmt(c.cost) : '—'}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{c.status}{c.neededBy ? ` · ${c.neededBy}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <label htmlFor={`cx-edit-stat-${c.id}`} className="sr-only">Status for {c.name}</label>
                    <select id={`cx-edit-stat-${c.id}`} className="text-xs border border-[#E8E4DC] bg-white px-2 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={c.status} onChange={e => updateCapexItem && updateCapexItem(c.id, { status: e.target.value })}>
                      {CAPEX_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label htmlFor={`cx-edit-proj-${c.id}`} className="sr-only">Project for {c.name}</label>
                    <select id={`cx-edit-proj-${c.id}`} className="text-xs border border-[#E8E4DC] bg-white px-2 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={c.projectId || ''} onChange={e => updateCapexItem && updateCapexItem(c.id, { projectId: e.target.value })}>
                      <option value="">— no project —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <label htmlFor={`cx-edit-date-${c.id}`} className="sr-only">Target date for {c.name}</label>
                    <input id={`cx-edit-date-${c.id}`} type="date" className="text-xs border border-[#E8E4DC] bg-white px-2 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={c.purchaseTargetDate || ''} onChange={e => updateCapexItem && updateCapexItem(c.id, { purchaseTargetDate: e.target.value })} />
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] ml-auto" />
                    <button type="button" onClick={() => { if (confirm(`Delete "${c.name}"? This cannot be undone.`)) deleteCapexItem && deleteCapexItem(c.id); }} aria-label={`Delete ${c.name}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {compact && (
        <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Add or edit inventory items in the <strong>Inventory · Capital Forecast</strong> sub-tab above.
        </p>
      )}
    </div>
  );
}

// =============================================================================
// PROJECTS · TIMELINE · WORKLOAD COORDINATION — v17
// Multi-domain project tracking with start/end dates and workload visualization
// =============================================================================
// v21: ProjectsWrapper — sub-nav between Projects list and Scopes
function ProjectsWrapper({ projects, scopes, entities, contractors = [], addProject, updateProject, deleteProject, addScope, deleteScope, capexItems = [], addCapexItem, updateCapexItem, deleteCapexItem, netCashFlow = 0, rentals = [], accounts = [] }) {
  const [subView, setSubView] = useState('list');
  return (
    <div className="space-y-4">
      <div className="border-b border-[#E8E4DC]">
        <div className="flex gap-1 text-xs">
          {[['list','Projects · Timeline'],['scopes','Scopes · Agreements'],['inventory','Inventory · Capital Forecast']].map(([id, label]) => (
            <button key={id} onClick={() => setSubView(id)} className={`px-3 py-2 whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${subView === id ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
          ))}
        </div>
      </div>
      {subView === 'list' && (
        <>
          <Projects projects={projects} entities={entities} contractors={contractors} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} />
          {/* v28+ MVP v1.5 round 3 — Inventory + forecast also appears at the
              bottom of the Projects list so the connection is obvious. The
              dedicated Inventory sub-tab is where the editing/adding lives. */}
          <ProjectInventory projects={projects} entities={entities} capexItems={capexItems} addCapexItem={addCapexItem} updateCapexItem={updateCapexItem} deleteCapexItem={deleteCapexItem} netCashFlow={netCashFlow} rentals={rentals} accounts={accounts} compact />
        </>
      )}
      {subView === 'scopes' && <Scope scopes={scopes} projects={projects} entities={entities} addScope={addScope} deleteScope={deleteScope} />}
      {subView === 'inventory' && <ProjectInventory projects={projects} entities={entities} capexItems={capexItems} addCapexItem={addCapexItem} updateCapexItem={updateCapexItem} deleteCapexItem={deleteCapexItem} netCashFlow={netCashFlow} rentals={rentals} accounts={accounts} />}
    </div>
  );
}

// ProjectConversationLog — per-project conversation thread (mirrors the
// pattern used on property records and Practice inquiries). State lives
// inside the component so each project keeps its own form / open-toggle.
function ProjectConversationLog({ project, updateProject }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const blank = () => ({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const addNote = () => {
    if (!form.summary) { alert('Summary is required.'); return; }
    const entry = { ...form, id: `cv-${Date.now()}` };
    updateProject(project.id, { conversationLog: [...(project.conversationLog || []), entry] });
    setForm(blank()); setShowForm(false);
  };
  const deleteNote = (entryId) => {
    if (!confirm('Delete this conversation note?')) return;
    updateProject(project.id, { conversationLog: (project.conversationLog || []).filter(e => e.id !== entryId) });
  };
  const log = project.conversationLog || [];
  return (
    <div className="mt-3 pt-2 border-t border-[#E8E4DC]">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">💬 Conversations · {log.length}</div>
        <button type="button" onClick={(e) => { e.preventDefault(); setShowForm(!showForm); setForm(blank()); }} className="text-xs uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{showForm ? '× Cancel' : '+ Log a touchpoint'}</button>
      </div>
      {showForm && (
        <div className="bg-white border border-[#B85838] p-2 mb-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <input type="date" className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <input className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Who: client / contractor / stakeholder" value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} />
          </div>
          <input className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Summary (required) — e.g., 'kickoff call, requirements confirmed'" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          <textarea className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" rows="2" placeholder="Notes · decisions · next step · who owns what" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button type="button" onClick={addNote} className="w-full bg-[#1A1815] text-white py-1.5 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Note</button>
        </div>
      )}
      {log.length === 0 && !showForm ? (
        <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No conversation notes yet.</p>
      ) : (
        <div className="space-y-1">
          {[...log].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{e.date}{e.person ? ` · ${e.person}` : ''}</div>
                  <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.summary}</div>
                  {e.notes && <div className="text-[10px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.notes}</div>}
                </div>
                <button type="button" onClick={() => deleteNote(e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Projects({ projects, entities, contractors = [], addProject, updateProject, deleteProject }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [projError, setProjError] = useState('');
  const [openConvId, setOpenConvId] = useState(null);
  const [newProject, setNewProject] = useState({
    title: '', startDate: '', endDate: '', status: 'planning',
    domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal',
    contractorIds: []
  });

  const submitProject = () => {
    if (!newProject.title || !newProject.startDate) {
      setProjError('Title and start date are required.');
      return;
    }
    setProjError('');
    if (editingId) {
      updateProject(editingId, newProject);
      setEditingId(null);
    } else {
      addProject(newProject);
    }
    setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] });
    setShowForm(false);
  };

  const startEdit = (p) => {
    setNewProject({
      title: p.title, startDate: p.startDate, endDate: p.endDate || '',
      status: p.status, domain: p.domain, description: p.description || '',
      hoursPerWeek: p.hoursPerWeek || 0, entityId: p.entityId || 'e-personal',
      contractorIds: Array.isArray(p.contractorIds) ? p.contractorIds : []
    });
    setEditingId(p.id);
    setShowForm(false);
    setProjError('');
    // r19 — Inline edit per IN-PLACE-FIRST.md. The top "Add new" form stays
    // closed during edit; the same form mounts inline under the edited row.
    // Real Estate Quick-Edit pattern (shipped r7) — eyes stay where you tapped.
  };
  const cancelEdit = () => { setEditingId(null); setProjError(''); setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] }); };

  // Filter and sort
  const filtered = projects.filter(p => {
    if (filterDomain !== 'all' && p.domain !== filterDomain) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  // Compute timeline range
  const now = new Date();
  const visibleProjects = filtered.filter(p => p.status !== 'complete');
  let earliestDate = now;
  let latestDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  visibleProjects.forEach(p => {
    const s = new Date(p.startDate);
    const e = p.endDate ? new Date(p.endDate) : new Date(s.getFullYear(), s.getMonth() + 3, s.getDate());
    if (s < earliestDate) earliestDate = s;
    if (e > latestDate) latestDate = e;
  });
  const rangeStart = new Date(Math.min(earliestDate.getTime(), now.getTime() - 30*24*60*60000));
  const rangeEnd = new Date(latestDate.getTime() + 30*24*60*60000);
  const totalDays = Math.max(1, (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));

  // Workload calculation — sum of active project hours/week by month
  const monthlyWorkload = useMemo(() => {
    const months = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      months[key] = { label: MONTHS_ABBR[d.getMonth()] + " '" + String(d.getFullYear()).slice(2), hours: 0, projects: [] };
    }
    projects.filter(p => p.status === 'active' || p.status === 'ending-soon').forEach(p => {
      const s = new Date(p.startDate);
      const e = p.endDate ? new Date(p.endDate) : new Date(s.getFullYear() + 1, s.getMonth(), s.getDate());
      Object.keys(months).forEach(key => {
        const [y, m] = key.split('-').map(Number);
        const monthStart = new Date(y, m, 1);
        const monthEnd = new Date(y, m + 1, 0);
        if (e >= monthStart && s <= monthEnd) {
          months[key].hours += (p.hoursPerWeek || 0);
          months[key].projects.push(p.title);
        }
      });
    });
    return months;
  }, [projects, now]);

  const totalActiveHours = Object.values(monthlyWorkload).length > 0 ? Object.values(monthlyWorkload)[0].hours : 0;
  const peakWorkload = Math.max(...Object.values(monthlyWorkload).map(m => m.hours), 1);

  const domainColor = (key) => PROJECT_DOMAINS.find(d => d.key === key)?.color || '#5A5751';
  const domainLabel = (key) => PROJECT_DOMAINS.find(d => d.key === key)?.label || key;
  const statusColor = (s) => s === 'active' ? '#5A6E3D' : s === 'ending-soon' ? '#B85838' : s === 'complete' ? '#5A5751' : s === 'on-hold' ? '#8B6F47' : '#1A1815';

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Projects · Timeline · Workload</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>See your whole life at once.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Personal projects · family commitments · friend time · church work · day job · PoeTech · Poe Properties · TLC · tech repairs. Every project has a start, an end, and a weekly load. Track them all in one place so you can see when things are heavy and when they ease up. Coordinate, not just survive.
        </p>
      </section>

      {/* Snapshot stats — at a glance */}
      {projects.length > 0 && (
        <section>
          <div className="grid grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Active" value={`${projects.filter(p => p.status === 'active').length}`} sub="in flight" small accent="green" />
            <MetricCell label="Ending soon" value={`${projects.filter(p => p.status === 'ending-soon').length}`} sub="<30 days" small accent="rust" />
            <MetricCell label="Planning" value={`${projects.filter(p => p.status === 'planning').length}`} sub="to launch" small />
            <MetricCell label="Total weekly" value={`${projects.filter(p => p.status === 'active' || p.status === 'ending-soon').reduce((s,p) => s + (p.hoursPerWeek || 0), 0)}h`} sub="/wk active" small />
          </div>
        </section>
      )}

      {/* Workload visualization */}
      {projects.length > 0 && (
        <section>
          <SectionTitle eyebrow="Coordination">12-Month Workload Forecast · Hours / Week</SectionTitle>
          <div className="bg-white border border-[#1A1815] p-5">
            <div className="space-y-1.5">
              {Object.entries(monthlyWorkload).map(([key, m], i) => {
                const pct = (m.hours / peakWorkload) * 100;
                const isHeavy = m.hours > 40;
                const isModerate = m.hours > 20 && m.hours <= 40;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751] w-12 shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{m.label}</div>
                    <div className="flex-1 h-5 bg-[#FAF8F4] border border-[#E8E4DC] relative">
                      <div className={`h-full ${isHeavy ? 'bg-[#B85838]' : isModerate ? 'bg-[#8B6F47]' : 'bg-[#5A6E3D]'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      {m.hours > 0 && <div className="absolute inset-0 flex items-center px-2 text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: isHeavy ? '#FAF8F4' : '#1A1815' }}>{m.hours}h/wk · {m.projects.length} active</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
              Olive: sustainable (≤20h/wk added load) · Brown: stretched (20-40h) · Terracotta: overloaded (40+h). When you can see the heavy months coming, you can plan rest, delegate, or push timelines.
            </p>
          </div>
        </section>
      )}

      {/* Filter + add */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Projects</h2>
          <div className="flex gap-2 flex-wrap items-center">
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
              <option value="all">All domains</option>
              {PROJECT_DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" onClick={() => { setEditingId(null); setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] }); setShowForm(!showForm); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add project'}</button>
          </div>
        </div>

        {/* r19 — Top form panel ONLY for ADD NEW. Edit happens inline under
            the edited row (see renderProjectForm + the row map below). */}
        {showForm && !editingId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New project</div>
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Project title (e.g., PoeTech v1 launch, kitchen renovation, mom's care plan)" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Start date</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">End date (target)</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Domain</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.domain} onChange={e => setNewProject({...newProject, domain: e.target.value})}>
                  {PROJECT_DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Hours / week (estimate)</label>
                <input type="number" min="0" step="1" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.hoursPerWeek} onChange={e => setNewProject({...newProject, hoursPerWeek: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity (optional)</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.entityId} onChange={e => setNewProject({...newProject, entityId: e.target.value})}>
                  <option value="e-personal">Personal</option><option value="e-poeprops">Poe Properties</option><option value="e-poetech">PoeTech</option><option value="e-tlc">TLC Therapy</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">1099 contractors assigned (optional)</label>
              {contractors.length === 0 ? (
                <div className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No contractors yet — add them in Books · 1099s. They'll appear here as toggleable chips.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {contractors.map(k => {
                    const assigned = (newProject.contractorIds || []).includes(k.id);
                    return (
                      <button type="button" key={k.id} onClick={() => setNewProject({ ...newProject, contractorIds: assigned ? (newProject.contractorIds || []).filter(id => id !== k.id) : [...(newProject.contractorIds || []), k.id] })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${assigned ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`}>
                        {assigned ? '✓ ' : ''}{k.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Optional — attach the 1099 workers helping with this project so YTD tracking and tax docs flow correctly.</p>
            </div>
            {/* Round 7 fix — bumped rows from 2 → 8 so multi-line descriptions
                (especially the auto-created "Wrap me with the tech" handoff
                from Dev/Ops, which includes the opportunity context) are fully
                visible and editable without scrolling inside the textarea. */}
            <div>
              <label htmlFor="proj-desc" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Description · key milestones · who's involved · opportunity context (for auto-created projects from Dev/Ops, this carries the example + tech-stack details — feel free to edit)</label>
              <textarea id="proj-desc" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" rows="8" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
            </div>
            {projError && <div className="text-xs text-[#B85838] mb-2 px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{projError}</div>}
            <button type="button" onClick={submitProject} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Project'}</button>
          </div>
        )}

        {filtered.length === 0 && !showForm && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
              No projects yet. Add the things you're working on across your life — work, family, ministry, side projects, repairs. The first ones often feel obvious; the value comes when you can see them all together.
            </p>
            <button type="button" onClick={() => {
              const examples = [
                { title: 'PoeTech v1 Public Launch · Loved Ones cohort', startDate: '2026-05-16', endDate: '2026-09-30', status: 'active', domain: 'business-poetech', description: 'Foundation launch through Church of the Living God. Onboard first 100 founding families. Validate pricing tiers and core Financial module.', hoursPerWeek: 20, entityId: 'e-poetech' },
                { title: 'Christiana college transition', startDate: '2026-05-16', endDate: '2026-08-25', status: 'active', domain: 'family', description: 'Visits, paperwork, dorm prep, financial aid coordination, the goodbye conversations that matter.', hoursPerWeek: 4, entityId: 'e-personal' },
                { title: 'Sponsor outreach Q3 — first cohort', startDate: '2026-06-01', endDate: '2026-08-31', status: 'planning', domain: 'business-poetech', description: 'Reach out to Tier B + C targets. Sign 1 Module Sponsor + 2 Directory Partners by Sept.', hoursPerWeek: 5, entityId: 'e-poetech' },
                { title: '1508 Holly Hill — resolve LATE rent', startDate: '2026-05-16', endDate: '2026-06-15', status: 'ending-soon', domain: 'business-poeprops', description: 'Tenant conversation, payment plan or escalation. Recover $850 gap or transition unit.', hoursPerWeek: 3, entityId: 'e-poeprops' },
                { title: 'TLC — add 1-2 MSW contractors', startDate: '2026-06-01', endDate: '2026-09-15', status: 'planning', domain: 'business-tlc', description: 'Recruit through Christina\'s clinical network. Each contractor = ~$2K/mo additional revenue.', hoursPerWeek: 4, entityId: 'e-tlc' },
                { title: 'Holy Spirit Integration Worldview · finish + KDP', startDate: '2026-05-16', endDate: '2026-11-30', status: 'active', domain: 'business-poetech', description: 'Complete the book. KDP submission. Print proof. Launch alongside Spiritual Life module.', hoursPerWeek: 6, entityId: 'e-poetech' },
              ];
              examples.forEach(ex => addProject(ex));
            }} className="text-[10px] uppercase tracking-wider px-4 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white">
              📋 Load 6 example projects to see how it works
            </button>
            <p className="text-[10px] text-[#5A5751] mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
              You can delete any of the examples and add your own — they're just there to show the workload visualization at work.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(p => {
              const now = new Date();
              const start = new Date(p.startDate);
              const end = p.endDate ? new Date(p.endDate) : null;
              const isOverdue = end && end < now && p.status !== 'complete';
              const daysUntilEnd = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;
              const totalDays = end ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) : null;
              const daysElapsed = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
              const progressPct = totalDays && totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;
              return (
                <div key={p.id} className="bg-white border-l-4 border border-[#E8E4DC] p-4" style={{ borderLeftColor: domainColor(p.domain) }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{p.title}</h4>
                    {/* Round 7 — properly-sized Edit / Delete tap targets, divider between them. */}
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <span style={{ color: statusColor(p.status) }} className="font-medium px-2">{p.status}{p.status === 'tbd' && ' · parked'}</span>
                      {/* Round 11 — TBD projects show a "Promote → Active" button so the user
                          can flip them when capacity opens up. Plain text-only edit otherwise. */}
                      {p.status === 'tbd' && (
                        <>
                          <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
                          <button type="button" onClick={() => updateProject(p.id, { status: 'planning' })} aria-label={`Promote ${p.title} from TBD to planning`} className="text-xs uppercase tracking-wider text-[#5A6E3D] hover:text-white hover:bg-[#5A6E3D] border border-[#5A6E3D] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">▶ Promote</button>
                        </>
                      )}
                      <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
                      <button type="button" onClick={() => startEdit(p)} aria-label={`Edit project ${p.title}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ Edit</button>
                      <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
                      <button type="button" onClick={() => { if (confirm(`Delete project "${p.title}"?`)) deleteProject(p.id); }} aria-label={`Delete project ${p.title}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
                    </div>
                  </div>
                  <div className="text-xs text-[#5A5751] mb-2">
                    <span style={{ color: domainColor(p.domain) }} className="font-medium">{domainLabel(p.domain)}</span>
                    <span> · </span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{start.toLocaleDateString()}</span>
                    {end && <><span> → </span><span style={{ fontFamily: '"JetBrains Mono", monospace' }} className={isOverdue ? 'text-[#B85838] font-medium' : ''}>{end.toLocaleDateString()}{isOverdue ? ' (overdue)' : daysUntilEnd > 0 && daysUntilEnd < 30 ? ` (${daysUntilEnd}d left)` : ''}</span></>}
                    {p.hoursPerWeek > 0 && <> · {p.hoursPerWeek}h/wk</>}
                  </div>
                  {Array.isArray(p.contractorIds) && p.contractorIds.length > 0 && (
                    <div className="text-[10px] text-[#5A5751] mb-2 flex flex-wrap gap-1.5">
                      <span className="uppercase tracking-wider">👤 1099:</span>
                      {p.contractorIds.map(cid => {
                        const k = contractors.find(c => c.id === cid);
                        return k ? <span key={cid} className="px-1.5 py-0.5 border border-[#E8E4DC] bg-[#FAF8F4]" style={{ fontFamily: '"Fraunces", serif' }}>{k.name}</span> : null;
                      })}
                    </div>
                  )}
                  {totalDays && p.status !== 'complete' && (
                    <div className="h-1 bg-[#E8E4DC] mb-2">
                      <div className="h-full" style={{ width: `${progressPct}%`, backgroundColor: domainColor(p.domain) }}></div>
                    </div>
                  )}
                  {p.description && <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{p.description}</p>}
                  <div className="mt-2">
                    {/* Round 9 — type="button" prevents default-submit behavior on browsers
                        that interpret a naked <button> as a form-submit even without a form
                        ancestor (which can scroll the page to the top under some conditions). */}
                    <button type="button" onClick={(e) => { e.preventDefault(); setOpenConvId(openConvId === p.id ? null : p.id); }} className="text-xs uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
                      {openConvId === p.id ? '× Close conversations' : `💬 Conversations (${(p.conversationLog || []).length})`}
                    </button>
                  </div>
                  {openConvId === p.id && <ProjectConversationLog project={p} updateProject={updateProject} />}
                  {/* r19 — Inline edit form, mounted DIRECTLY under the row
                      the user clicked Edit on. No jump-to-top, eyes stay put.
                      Per IN-PLACE-FIRST.md + Real Estate Quick-Edit pattern. */}
                  {editingId === p.id && (
                    <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {p.title}</div>
                        <button type="button" onClick={cancelEdit} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Cancel</button>
                      </div>
                      <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" placeholder="Project title" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Start date</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} /></div>
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">End date (target)</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Domain</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.domain} onChange={e => setNewProject({...newProject, domain: e.target.value})}>{PROJECT_DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select></div>
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>{PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Hours / week</label><input type="number" min="0" step="1" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.hoursPerWeek} onChange={e => setNewProject({...newProject, hoursPerWeek: parseInt(e.target.value) || 0})} /></div>
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.entityId} onChange={e => setNewProject({...newProject, entityId: e.target.value})}><option value="e-personal">Personal</option><option value="e-poeprops">Poe Properties</option><option value="e-poetech">PoeTech</option><option value="e-tlc">TLC Therapy</option></select></div>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">1099 contractors assigned</label>
                        {contractors.length === 0 ? (
                          <div className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No contractors yet — add them in Books · 1099s.</div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {contractors.map(k => {
                              const assigned = (newProject.contractorIds || []).includes(k.id);
                              return (
                                <button type="button" key={k.id} onClick={() => setNewProject({ ...newProject, contractorIds: assigned ? (newProject.contractorIds || []).filter(id => id !== k.id) : [...(newProject.contractorIds || []), k.id] })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${assigned ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`}>
                                  {assigned ? '✓ ' : ''}{k.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor={`proj-desc-edit-${p.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Description · milestones · context</label>
                        <textarea id={`proj-desc-edit-${p.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" rows="6" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
                      </div>
                      {projError && <div className="text-xs text-[#B85838] px-3 py-2 bg-white border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{projError}</div>}
                      <div className="flex gap-2">
                        <button type="button" onClick={submitProject} className="flex-1 bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                        <button type="button" onClick={cancelEdit} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// DateField - input type="date" with explicit year nav (arrows + dropdown)
// Browser native date picker keeps working; arrows step by 1 year, dropdown
// jumps to any year in range (currentYear - 5 to currentYear + 25).
function DateField({ value, onChange, className }) {
  const todayY = new Date().getFullYear();
  const currentYear = value && /^\d{4}-/.test(value) ? parseInt(value.slice(0, 4)) : todayY;
  const years = [];
  for (let y = currentYear - 10; y <= currentYear + 30; y++) years.push(y);
  const setYear = (year) => {
    if (!value) {
      const t = new Date();
      const m = String(t.getMonth() + 1).padStart(2, '0');
      const d = String(t.getDate()).padStart(2, '0');
      onChange(`${year}-${m}-${d}`);
      return;
    }
    const [, mm, dd] = value.split('-');
    onChange(`${year}-${mm || '01'}-${dd || '01'}`);
  };
  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <button type="button" onClick={() => setYear(currentYear - 1)} title="Previous year" aria-label="Previous year" className="px-2 py-1.5 text-xs border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] bg-[#FAF8F4]">«</button>
      <input type="date" className="flex-1 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={value || ''} onChange={e => onChange(e.target.value)} />
      <button type="button" onClick={() => setYear(currentYear + 1)} title="Next year" aria-label="Next year" className="px-2 py-1.5 text-xs border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] bg-[#FAF8F4]">»</button>
      <select value={currentYear} onChange={e => setYear(parseInt(e.target.value))} className="p-2 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" title="Jump to year" aria-label="Jump to year">
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

function Calendar({ data, reserves, addRecurring, addIncident, addEvent, completeEvent, deleteRecurring, deleteIncident, deleteEvent, notifPermission, requestNotif, upcomingEvents }) {
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
                <option value="e-personal">Personal</option><option value="e-poeprops">Poe Properties</option><option value="e-poetech">PoeTech</option><option value="e-tlc">TLC Therapy</option>
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
                  <div className="text-xs text-[#5A5751]">{r.frequency} · {r.category}</div>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(r.amount)}</div>
                  <button type="button" onClick={() => deleteRecurring(r.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                </div>
              </div>
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
                <option value="e-personal">Personal</option><option value="e-poeprops">Poe Properties</option><option value="e-poetech">PoeTech</option><option value="e-tlc">TLC Therapy</option>
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
                <option value="e-personal">Personal</option><option value="e-poeprops">Poe Properties</option><option value="e-poetech">PoeTech</option><option value="e-tlc">TLC Therapy</option>
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
                    <button type="button" onClick={() => deleteEvent(e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                  </div>
                </div>
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

// =============================================================================
// SCOPE — from v6
// =============================================================================
function Scope({ scopes, projects = [], entities, addScope, deleteScope }) {
  const [mode, setMode] = useState('list');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeScopeId, setActiveScopeId] = useState(null);
  const [formData, setFormData] = useState({});

  const startNew = (t) => { setSelectedTemplate(t); setFormData({ templateType: t.type, templateName: t.name, ...t.defaults, entityId: t.entityId, contractorName: '', contractorEmail: '', contractorPhone: '', projectId: '' }); setMode('new'); };
  const saveNew = () => { if (!formData.title || !formData.contractorName) { alert('Title and contractor name are required.'); return; } addScope(formData); setMode('list'); setFormData({}); };
  const viewScope = (s) => { setActiveScopeId(s.id); setMode('view'); };
  const activeScope = scopes.find(s => s.id === activeScopeId);

  if (mode === 'view' && activeScope) {
    return <ScopeView scope={activeScope} projects={projects} entities={entities} onBack={() => setMode('list')} onDelete={() => { if (confirm('Delete this scope?')) { deleteScope(activeScope.id); setMode('list'); } }} />;
  }
  if (mode === 'new') {
    return <ScopeForm formData={formData} setFormData={setFormData} projects={projects} entities={entities} templateName={selectedTemplate?.name} onSave={saveNew} onCancel={() => { setMode('list'); setFormData({}); }} />;
  }
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle eyebrow="Scope of Work">Contractor Agreements</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>Before work begins, write the scope. Both sides agree. Reviews anchor to the scope, not evolving wishes. Each scope can stand alone OR link to an internal project so the work is tracked in the right timeline.</p>
      </section>
      <section>
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-3 pb-2 border-b border-[#1A1815]">Start from a template</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SCOPE_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => startNew(t)} className="bg-white border border-[#1A1815] p-4 text-left hover:border-[#B85838]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium mb-1">{t.type}</div>
              <h4 className="text-lg mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{t.name}</h4>
              <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{t.description}</p>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-3 pb-2 border-b border-[#1A1815]">Your scopes ({scopes.length})</h3>
        {scopes.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-8 text-center"><p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No scopes yet. Pick a template above.</p></div>
        ) : (
          <div className="space-y-2">
            {scopes.map(s => { const entity = entities.find(e => e.id === s.entityId); const proj = projects.find(p => p.id === s.projectId); return (
              <button key={s.id} onClick={() => viewScope(s)} className="w-full text-left bg-white border border-[#1A1815] p-4 hover:border-[#B85838]">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div>
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.title}</div>
                    <div className="text-xs text-[#5A5751] mt-1">{s.contractorName} · {entity?.name.split('(')[0].trim()}</div>
                    {proj && <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] mt-1 font-medium">⛓ Linked to: {proj.title}</div>}
                    {!proj && s.projectId === '' && <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-1">Standalone</div>}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{s.status}</div>
                </div>
              </button>
            );})}
          </div>
        )}
      </section>
    </div>
  );
}

function ScopeForm({ formData, setFormData, projects = [], entities, templateName, onSave, onCancel }) {
  const update = (f) => (e) => setFormData({ ...formData, [f]: e.target.value });
  return (
    <div className="space-y-4 max-w-3xl">
      <section className="flex items-baseline justify-between border-b border-[#1A1815] pb-3">
        <div><div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium">New Scope · {templateName}</div><h2 className="text-xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Fill out the agreement</h2></div>
        <button type="button" onClick={onCancel} className="text-[10px] uppercase tracking-wider text-[#5A5751]">× Cancel</button>
      </section>
      <FormField label="Job title *"><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.title || ''} onChange={update('title')} /></FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Entity"><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.entityId || 'e-personal'} onChange={update('entityId')}>{entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></FormField>
        <FormField label="Link to internal project (optional)"><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.projectId || ''} onChange={update('projectId')}>
          <option value="">— Standalone (no project)</option>
          {projects.filter(p => p.status !== 'complete').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select></FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Contractor name *"><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.contractorName || ''} onChange={update('contractorName')} /></FormField>
        <FormField label="Email"><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.contractorEmail || ''} onChange={update('contractorEmail')} /></FormField>
        <FormField label="Phone"><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.contractorPhone || ''} onChange={update('contractorPhone')} /></FormField>
      </div>
      <FormField label="Scope of work"><textarea rows="4" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.scopeOfWork || ''} onChange={update('scopeOfWork')} /></FormField>
      <FormField label="Deliverables"><textarea rows="3" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.deliverables || ''} onChange={update('deliverables')} /></FormField>
      <FormField label="Materials"><textarea rows="3" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.materials || ''} onChange={update('materials')} /></FormField>
      <FormField label="Schedule"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.schedule || ''} onChange={update('schedule')} /></FormField>

      {/* Round 12 — Materials-paid-by picker + suggested payment terms.
          Policy baked in:
            · Contractor supplies materials → 50% deposit / 50% on completion.
              The 50% deposit reflects the contractor's real material outlay.
            · Owner supplies materials → no big deposit needed (the contractor
              isn't fronting material costs). Pay full at completion is the
              default — fairer for both sides. Exception: if the contractor
              genuinely needs cash to hire help or cover small startup costs,
              a 20% start fee is reasonable.
            · Split → negotiate based on material split %.
          The picker auto-generates suggested payment terms; user can still
          edit the textarea freely. */}
      <FormField label="Who pays for materials? (drives payment terms)">
        <select
          className="w-full p-2 border border-[#E8E4DC] text-sm bg-white"
          value={formData.materialsPaidBy || 'contractor'}
          onChange={(e) => {
            const who = e.target.value;
            const suggested =
              who === 'owner'        ? 'Owner supplies all materials. Contractor invoices labor ONLY. Default: pay full balance within 7 days of acceptance walkthrough. If contractor needs start money (helpers, small startup costs), 20% labor-only deposit on day 1; balance at acceptance.' :
              who === 'split'        ? 'Materials split per the Materials section above. Deposit covers contractor-supplied materials only (typically 50% of contractor materials). Balance + labor at acceptance.' :
                                       '50% deposit on materials delivery to cover contractor outlay. 50% balance within 7 days of acceptance walkthrough. Paid via 1099 (W-9 on file).';
            setFormData({ ...formData, materialsPaidBy: who, paymentTerms: suggested });
          }}
        >
          <option value="contractor">Contractor supplies materials → 50% / 50%</option>
          <option value="owner">Owner supplies materials → pay at completion (or 20% start)</option>
          <option value="split">Split → negotiated terms</option>
        </select>
        <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>Policy:</strong> When the owner pays for materials, the contractor isn't fronting that cost — so a 50% material-style deposit isn't fair. Default is "pay full at completion," with a 20% labor-only start fee available if the contractor needs help-hire money or small startup outlay. Picking an option auto-fills the Payment Terms below; you can still edit.
        </p>
      </FormField>
      <FormField label="Payment terms"><textarea rows="3" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.paymentTerms || ''} onChange={update('paymentTerms')} /></FormField>
      <FormField label="Acceptance criteria"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.acceptanceCriteria || ''} onChange={update('acceptanceCriteria')} /></FormField>
      <FormField label="Requirements"><textarea rows="3" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.requirements || ''} onChange={update('requirements')} /></FormField>
      <FormField label="Warranty"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.warranty || ''} onChange={update('warranty')} /></FormField>
      <FormField label="Termination"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.terminationClause || ''} onChange={update('terminationClause')} /></FormField>
      <div className="flex gap-2 pt-3 border-t border-[#1A1815]">
        <button type="button" onClick={onSave} className="bg-[#1A1815] text-[#FAF8F4] px-6 py-2.5 text-xs uppercase tracking-wider">Save</button>
        <button type="button" onClick={onCancel} className="border border-[#1A1815] px-6 py-2.5 text-xs uppercase tracking-wider">Cancel</button>
      </div>
    </div>
  );
}

function ScopeView({ scope, projects = [], entities, onBack, onDelete }) {
  const entity = entities.find(e => e.id === scope.entityId);
  const linkedProject = projects.find(p => p.id === scope.projectId);
  return (
    <div className="space-y-4 max-w-3xl">
      <section className="flex items-baseline justify-between border-b border-[#1A1815] pb-3 print:hidden">
        <button type="button" onClick={onBack} className="text-[10px] uppercase tracking-wider">← Back</button>
        <div className="flex gap-3"><button type="button" onClick={() => window.print()} className="text-[10px] uppercase tracking-wider text-[#B85838]">⎙ Print</button><button type="button" onClick={onDelete} className="text-[10px] uppercase tracking-wider">× Delete</button></div>
      </section>
      <div className="bg-white border border-[#1A1815] p-6 sm:p-8 print:border-0 print:p-0">
        <div className="text-center mb-6 pb-6 border-b border-[#E8E4DC]">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1">Scope of Work · {scope.templateType}</div>
          <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{scope.title}</h1>
        </div>
        <div className="space-y-5 text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E8E4DC]">
            <div><div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-1">Engaging Entity</div><div>{entity?.name}</div></div>
            <div><div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-1">Contractor</div><div>{scope.contractorName}</div></div>
          </div>
          {[['Scope of Work', scope.scopeOfWork], ['Deliverables', scope.deliverables], ['Materials', scope.materials], ['Schedule', scope.schedule], ['Payment Terms', scope.paymentTerms], ['Acceptance', scope.acceptanceCriteria], ['Requirements', scope.requirements], ['Warranty', scope.warranty], ['Termination', scope.terminationClause]].map(([t, c]) => c && c.trim() ? (
            <div key={t}><div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium mb-1.5">{t}</div><div className="whitespace-pre-line">{c}</div></div>
          ) : null)}
        </div>
        <div className="mt-8 pt-6 border-t border-[#1A1815]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-4">Acknowledgement</div>
          <div className="grid grid-cols-2 gap-8">
            <div><div className="border-b border-[#1A1815] h-8"></div><div className="text-xs text-[#5A5751] mt-1">{entity?.name.split('(')[0].trim()}</div></div>
            <div><div className="border-b border-[#1A1815] h-8"></div><div className="text-xs text-[#5A5751] mt-1">{scope.contractorName}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }) { return (<div><label className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-1 block">{label}</label>{children}</div>); }

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
const ROOM_PRESETS = ['Living Room','Kitchen','Dining Room','Bathroom','Master Bedroom','Bedroom 1','Bedroom 2','Bedroom 3','Garage','Basement','Attic','Laundry','Office','Outdoor'];
const ROOM_ITEM_PRESETS = ['Cabinets','Windows','Furnace','Plumbing — Toilet','Plumbing — Sink','Plumbing — Faucet','Plumbing — Bathtub','Plumbing — Shower','Flooring','Walls / Paint','Ceiling','Lighting','Outlets / Switches','Doors','Trim','Other'];
const ROOM_ITEM_STATUSES = [
  { key: 'good',       label: 'Good',           symbol: '✓' },
  { key: 'needs-work', label: 'Needs work',     symbol: '!' },
  { key: 'quoted',     label: 'Quoted',         symbol: '$' },
  { key: 'scheduled',  label: 'Scheduled',      symbol: '→' },
  { key: 'done',       label: 'Done',           symbol: '★' },
];
const EQUIPMENT_CATEGORIES = ['HVAC','Furnace','AC Unit','Water Heater','Refrigerator','Stove / Oven','Dishwasher','Washer','Dryer','Microwave','Garbage Disposal','Sump Pump','Roof','Electrical Panel','Garage Door','Other'];

function PropertyDetails({ rental, updateRental }) {
  // v28+ MVP v1.5 round 8 — Property valuation block (Zillow-style)
  // Characteristics + a market-value field + auto-built lookup links.
  // No paid API — links pre-fill each major site's search with the address,
  // user clicks, eyeballs the Zestimate, types it back into the manual field.
  // Estimated equity = market value − mortgage balance.
  const blankMarket = () => ({
    beds: rental.market?.beds || '',
    baths: rental.market?.baths || '',
    sqft: rental.market?.sqft || '',
    lotSize: rental.market?.lotSize || '',
    yearBuilt: rental.market?.yearBuilt || '',
    taxAssessedValue: rental.market?.taxAssessedValue || 0,
    marketValue: rental.market?.marketValue || rental.estimatedValue || 0,
    valueAsOf: rental.market?.valueAsOf || '',
    valueSource: rental.market?.valueSource || '', // Zillow / Realtor / Redfin / appraisal / county
  });
  const [marketForm, setMarketForm] = useState(blankMarket());
  const [editingMarket, setEditingMarket] = useState(false);
  const saveMarket = () => {
    updateRental(rental.id, {
      market: {
        ...marketForm,
        taxAssessedValue: parseFloat(marketForm.taxAssessedValue) || 0,
        marketValue: parseFloat(marketForm.marketValue) || 0,
      },
    });
    setEditingMarket(false);
  };
  // Round 8 fix — direct site URLs were inconsistent (Zillow's `/homes/X_rb/`
  // doesn't always route to the property page; Redfin's autocomplete endpoint
  // isn't a public URL; Trulia's `/p/?searchTerm=` 404s on many addresses).
  // Replacement: Google site-scoped search with the FULL address in quotes.
  // The first result is the property's page on that site — works 100% of the
  // time and survives any URL-structure change the sites make. Also marks
  // valueSource + valueAsOf when clicked so the user has a click trail.
  const addressQuery = [rental.address, rental.city, rental.state, rental.zip].filter(Boolean).join(', ');
  const quoted = `"${addressQuery}"`;
  const lookupLinks = addressQuery ? [
    { name: 'Zillow',        url: `https://www.google.com/search?q=${encodeURIComponent(quoted + ' site:zillow.com')}` },
    { name: 'Realtor.com',   url: `https://www.google.com/search?q=${encodeURIComponent(quoted + ' site:realtor.com')}` },
    { name: 'Redfin',        url: `https://www.google.com/search?q=${encodeURIComponent(quoted + ' site:redfin.com')}` },
    { name: 'Trulia',        url: `https://www.google.com/search?q=${encodeURIComponent(quoted + ' site:trulia.com')}` },
    { name: 'County Records',url: `https://www.google.com/search?q=${encodeURIComponent(quoted + ' assessor parcel')}` },
  ] : [];
  // Round 10 fix — Two-step confirmation flow. Clicking a lookup link opens
  // the site in a new tab AND shows an inline ASK panel: "Save the value you
  // saw on [Site] as this property's market value?" The user types the number
  // they read and explicitly clicks "Save". Nothing changes until they confirm.
  // Skip closes the panel without touching the data.
  const [capturePrompt, setCapturePrompt] = useState(null); // { source, value, askPhase }
  const onLookupClick = (source) => {
    // Don't mutate any data on click — just open the prompt in ASK phase.
    setCapturePrompt({ source, value: '', askPhase: 'ask' });
  };
  const confirmSaveValue = () => {
    if (!capturePrompt || !capturePrompt.value) {
      alert('Enter the value you saw on the site, or tap Skip to close without saving.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const newVal = parseFloat(capturePrompt.value) || 0;
    updateRental(rental.id, {
      market: {
        ...(rental.market || {}),
        marketValue: newVal,
        valueSource: capturePrompt.source,
        valueAsOf: today,
      },
    });
    setMarketForm(f => ({ ...f, marketValue: newVal, valueSource: capturePrompt.source, valueAsOf: today }));
    setCapturePrompt(null);
  };
  const skipCapture = () => setCapturePrompt(null);
  const currentMarketValue = parseFloat(rental.market?.marketValue) || 0;
  const mortgageBalance = parseFloat(rental.mortgage?.balance) || 0;
  const estimatedEquity = currentMarketValue > 0 ? currentMarketValue - mortgageBalance : null;

  // Lease + tenant — single edit form (collapsible).
  const blankLease = () => ({
    start: rental.lease?.start || '',
    end: rental.lease?.end || '',
    monthlyRent: rental.lease?.monthlyRent || rental.rent || 0,
    deposit: rental.lease?.deposit || 0,
    lateFeePolicy: rental.lease?.lateFeePolicy || '',
    signedDocURL: rental.lease?.signedDocURL || '',
  });
  const blankTenant = () => ({
    name: rental.tenant?.name || rental.tenantName || '',
    phone: rental.tenant?.phone || '',
    email: rental.tenant?.email || '',
    moveIn: rental.tenant?.moveIn || '',
    emergencyContactName: rental.tenant?.emergencyContactName || '',
    emergencyContactPhone: rental.tenant?.emergencyContactPhone || '',
  });
  const [leaseForm, setLeaseForm] = useState(blankLease());
  const [tenantForm, setTenantForm] = useState(blankTenant());
  const [editingLeaseTenant, setEditingLeaseTenant] = useState(false);

  const saveLeaseTenant = () => {
    updateRental(rental.id, {
      lease: {
        ...leaseForm,
        monthlyRent: parseFloat(leaseForm.monthlyRent) || 0,
        deposit: parseFloat(leaseForm.deposit) || 0,
      },
      tenant: { ...tenantForm },
      tenantName: tenantForm.name, // keep legacy field in sync so existing UI shows the name
    });
    setEditingLeaseTenant(false);
  };

  // Equipment list
  const blankEquip = () => ({ category: 'HVAC', make: '', model: '', serial: '', installDate: '', warrantyEnd: '', notes: '' });
  const [equipForm, setEquipForm] = useState(blankEquip());
  const [showEquipForm, setShowEquipForm] = useState(false);
  const addEquipment = () => {
    if (!equipForm.category) return;
    const entry = { ...equipForm, id: `eq-${Date.now()}` };
    updateRental(rental.id, { equipment: [...(rental.equipment || []), entry] });
    setEquipForm(blankEquip()); setShowEquipForm(false);
  };
  const deleteEquipment = (eqId) => {
    if (!confirm('Remove this piece of equipment? Warranty & serial data will be lost.')) return;
    updateRental(rental.id, { equipment: (rental.equipment || []).filter(e => e.id !== eqId) });
  };

  // Rooms & Needed Work
  const [roomName, setRoomName] = useState('');
  const [roomItem, setRoomItem] = useState({ roomId: '', name: '', status: 'needs-work', notes: '' });
  const [showRoomForm, setShowRoomForm] = useState(false);
  const addRoom = () => {
    const name = (roomName || '').trim();
    if (!name) return;
    const entry = { id: `rm-${Date.now()}`, name, items: [] };
    updateRental(rental.id, { rooms: [...(rental.rooms || []), entry] });
    setRoomName('');
  };
  const deleteRoom = (rmId) => {
    if (!confirm('Delete this room and all of its items?')) return;
    updateRental(rental.id, { rooms: (rental.rooms || []).filter(r => r.id !== rmId) });
  };
  const addRoomItem = () => {
    if (!roomItem.roomId || !roomItem.name) return;
    const rooms = (rental.rooms || []).map(rm => rm.id === roomItem.roomId
      ? { ...rm, items: [...(rm.items || []), { id: `it-${Date.now()}`, name: roomItem.name, status: roomItem.status, notes: roomItem.notes }] }
      : rm);
    updateRental(rental.id, { rooms });
    setRoomItem({ roomId: roomItem.roomId, name: '', status: 'needs-work', notes: '' });
    setShowRoomForm(false);
  };
  const updateRoomItemStatus = (rmId, itId, status) => {
    const rooms = (rental.rooms || []).map(rm => rm.id === rmId
      ? { ...rm, items: (rm.items || []).map(it => it.id === itId ? { ...it, status } : it) }
      : rm);
    updateRental(rental.id, { rooms });
  };
  const deleteRoomItem = (rmId, itId) => {
    const rooms = (rental.rooms || []).map(rm => rm.id === rmId
      ? { ...rm, items: (rm.items || []).filter(it => it.id !== itId) }
      : rm);
    updateRental(rental.id, { rooms });
  };

  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">🏠 Property Details</div>

      {/* MARKET VALUATION — round 8 */}
      <details className="bg-white border border-[#E8E4DC] p-3 mb-2" open>
        <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          🏘 Market Valuation &amp; Property Info
          {currentMarketValue > 0 && (
            <span className="ml-2 text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              · est value {fmt(currentMarketValue)}
              {estimatedEquity != null && <> · equity {fmt(estimatedEquity)}</>}
            </span>
          )}
        </summary>
        <div className="mt-3 space-y-3">
          {/* Lookup links — auto-built from this property's address */}
          {addressQuery ? (
            <div>
              <div className={labelCls + ' mb-1.5'}>Look up market value (opens in new tab → asks to save)</div>
              <div className="flex flex-wrap gap-1">
                {lookupLinks.map(l => (
                  <a
                    key={l.name}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onLookupClick(l.name)}
                    className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >{l.name} ↗</a>
                ))}
              </div>
              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                Tap a link to open the property on that site via Google search (always finds the right address, even when site URLs change). When you come back, we'll ask if you want to save the value you saw — your call, nothing auto-stamps.
              </p>

              {/* Round 10 — Capture prompt. Opens after clicking any lookup link.
                  Asks explicitly whether to save the value the user saw. Nothing
                  in the data changes until they confirm. Skip closes without
                  touching anything. */}
              {capturePrompt && (
                <div className="mt-2 p-3 bg-[#FAF8F4] border-2 border-[#B85838]">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Save the value you saw on {capturePrompt.source}?</div>
                  <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    If {capturePrompt.source} shows a value for this property, type it here. We'll save it as the current market value and stamp <strong>{capturePrompt.source}</strong> as the source with today's date. Skip if you don't want to change anything.
                  </p>
                  <div className="flex items-end gap-2 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <label htmlFor={`cap-val-${rental.id}`} className={labelCls}>Value from {capturePrompt.source}</label>
                      <input
                        id={`cap-val-${rental.id}`}
                        type="number"
                        min="0"
                        step="100"
                        inputMode="decimal"
                        autoFocus
                        placeholder="e.g., 145000"
                        value={capturePrompt.value}
                        onChange={e => setCapturePrompt({ ...capturePrompt, value: e.target.value })}
                        className="w-full p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                      />
                    </div>
                    <button type="button" onClick={confirmSaveValue} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✓ Yes, save it</button>
                    <button type="button" onClick={skipCapture} className="border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Skip</button>
                  </div>
                  {currentMarketValue > 0 && (
                    <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                      Current saved value: {fmt(currentMarketValue)}{rental.market?.valueAsOf ? ` (as of ${rental.market.valueAsOf}${rental.market?.valueSource ? ` · ${rental.market.valueSource}` : ''})` : ''}. Confirming overwrites it.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Add a street address to this property (Edit → Address) to enable Zillow / Realtor / Redfin lookup links.</p>
          )}

          {/* Display vs edit toggle */}
          {!editingMarket ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
              <div><div className={labelCls}>Beds</div><div>{rental.market?.beds || '—'}</div></div>
              <div><div className={labelCls}>Baths</div><div>{rental.market?.baths || '—'}</div></div>
              <div><div className={labelCls}>Sqft</div><div>{rental.market?.sqft ? Number(rental.market.sqft).toLocaleString() : '—'}</div></div>
              <div><div className={labelCls}>Lot</div><div>{rental.market?.lotSize || '—'}</div></div>
              <div><div className={labelCls}>Year built</div><div>{rental.market?.yearBuilt || '—'}</div></div>
              <div><div className={labelCls}>Tax-assessed</div><div style={{ fontFamily: '"JetBrains Mono", monospace' }}>{rental.market?.taxAssessedValue ? fmt(rental.market.taxAssessedValue) : '—'}</div></div>
              <div>
                <div className={labelCls}>Market value</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{currentMarketValue > 0 ? fmt(currentMarketValue) : '—'}</div>
                <div className="text-[9px] text-[#5A5751]">{rental.market?.valueAsOf ? `as of ${rental.market.valueAsOf}` : 'not set'}{rental.market?.valueSource ? ` · ${rental.market.valueSource}` : ''}</div>
              </div>
              <div>
                <div className={labelCls}>Estimated equity</div>
                <div className={`${estimatedEquity != null && estimatedEquity < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{estimatedEquity != null ? fmt(estimatedEquity) : '—'}</div>
                <div className="text-[9px] text-[#5A5751]">value − mortgage</div>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <button type="button" onClick={() => { setMarketForm(blankMarket()); setEditingMarket(true); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ Edit valuation &amp; characteristics</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label htmlFor={`mk-beds-${rental.id}`} className={labelCls}>Beds</label><input id={`mk-beds-${rental.id}`} type="number" min="0" step="1" className={fieldCls} value={marketForm.beds} onChange={e => setMarketForm({ ...marketForm, beds: e.target.value })} /></div>
                <div><label htmlFor={`mk-baths-${rental.id}`} className={labelCls}>Baths</label><input id={`mk-baths-${rental.id}`} type="number" min="0" step="0.5" className={fieldCls} value={marketForm.baths} onChange={e => setMarketForm({ ...marketForm, baths: e.target.value })} /></div>
                <div><label htmlFor={`mk-sqft-${rental.id}`} className={labelCls}>Sqft</label><input id={`mk-sqft-${rental.id}`} type="number" min="0" step="10" className={fieldCls} value={marketForm.sqft} onChange={e => setMarketForm({ ...marketForm, sqft: e.target.value })} /></div>
                <div><label htmlFor={`mk-lot-${rental.id}`} className={labelCls}>Lot size</label><input id={`mk-lot-${rental.id}`} className={fieldCls} placeholder="e.g., 0.25 ac · 7,800 sqft" value={marketForm.lotSize} onChange={e => setMarketForm({ ...marketForm, lotSize: e.target.value })} /></div>
                <div><label htmlFor={`mk-year-${rental.id}`} className={labelCls}>Year built</label><input id={`mk-year-${rental.id}`} type="number" min="1800" max="2099" step="1" className={fieldCls} value={marketForm.yearBuilt} onChange={e => setMarketForm({ ...marketForm, yearBuilt: e.target.value })} /></div>
                <div><label htmlFor={`mk-tax-${rental.id}`} className={labelCls}>Tax-assessed value</label><input id={`mk-tax-${rental.id}`} type="number" min="0" step="100" inputMode="decimal" className={fieldCls} value={marketForm.taxAssessedValue} onChange={e => setMarketForm({ ...marketForm, taxAssessedValue: e.target.value })} /></div>
                <div><label htmlFor={`mk-val-${rental.id}`} className={labelCls}>Market value (manual)</label><input id={`mk-val-${rental.id}`} type="number" min="0" step="100" inputMode="decimal" className={fieldCls} value={marketForm.marketValue} onChange={e => setMarketForm({ ...marketForm, marketValue: e.target.value })} /></div>
                <div><label htmlFor={`mk-asof-${rental.id}`} className={labelCls}>Value as of</label><input id={`mk-asof-${rental.id}`} type="date" className={fieldCls} value={marketForm.valueAsOf} onChange={e => setMarketForm({ ...marketForm, valueAsOf: e.target.value })} /></div>
                <div className="col-span-2 sm:col-span-2"><label htmlFor={`mk-src-${rental.id}`} className={labelCls}>Source (where the number came from)</label><input id={`mk-src-${rental.id}`} className={fieldCls} placeholder="e.g., Zillow Zestimate · Redfin · 2024 appraisal · county records" value={marketForm.valueSource} onChange={e => setMarketForm({ ...marketForm, valueSource: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={saveMarket} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save</button>
                <button type="button" onClick={() => setEditingMarket(false)} className="bg-white border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* LEASE + TENANT */}
      <details className="bg-white border border-[#E8E4DC] p-3 mb-2">
        <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          Lease &amp; Tenant Contact
          {rental.lease?.end && <span className="ml-2 text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· lease ends {rental.lease.end}</span>}
        </summary>
        {!editingLeaseTenant ? (
          <div className="mt-3 space-y-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
            {!rental.lease && !rental.tenant ? (
              <p className="text-[#5A5751] italic">No lease or tenant info saved yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><span className="text-[#5A5751]">Lease term:</span> {rental.lease?.start || '—'} → {rental.lease?.end || '—'}</div>
                <div><span className="text-[#5A5751]">Monthly rent (lease):</span> {rental.lease?.monthlyRent ? fmt(rental.lease.monthlyRent) : '—'}</div>
                <div><span className="text-[#5A5751]">Deposit:</span> {rental.lease?.deposit ? fmt(rental.lease.deposit) : '—'}</div>
                <div><span className="text-[#5A5751]">Late-fee policy:</span> {rental.lease?.lateFeePolicy || '—'}</div>
                {rental.lease?.signedDocURL && <div className="sm:col-span-2"><span className="text-[#5A5751]">Signed lease:</span> <a href={rental.lease.signedDocURL} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838]">open</a></div>}
                <div><span className="text-[#5A5751]">Tenant:</span> {rental.tenant?.name || '—'}</div>
                <div><span className="text-[#5A5751]">Move-in:</span> {rental.tenant?.moveIn || '—'}</div>
                <div><span className="text-[#5A5751]">Phone:</span> {rental.tenant?.phone ? <a href={`tel:${rental.tenant.phone}`} className="underline text-[#B85838]">{rental.tenant.phone}</a> : '—'}</div>
                <div><span className="text-[#5A5751]">Email:</span> {rental.tenant?.email ? <a href={`mailto:${rental.tenant.email}`} className="underline text-[#B85838]">{rental.tenant.email}</a> : '—'}</div>
                <div><span className="text-[#5A5751]">Emergency contact:</span> {rental.tenant?.emergencyContactName || '—'}{rental.tenant?.emergencyContactPhone ? ` · ${rental.tenant.emergencyContactPhone}` : ''}</div>
              </div>
            )}
            <button type="button" onClick={() => { setLeaseForm(blankLease()); setTenantForm(blankTenant()); setEditingLeaseTenant(true); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] mt-1">Edit lease &amp; tenant</button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">Lease</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div><label htmlFor={`ls-start-${rental.id}`} className={labelCls}>Lease start</label><input id={`ls-start-${rental.id}`} type="date" className={fieldCls} value={leaseForm.start} onChange={e => setLeaseForm({ ...leaseForm, start: e.target.value })} /></div>
              <div><label htmlFor={`ls-end-${rental.id}`} className={labelCls}>Lease end</label><input id={`ls-end-${rental.id}`} type="date" className={fieldCls} value={leaseForm.end} onChange={e => setLeaseForm({ ...leaseForm, end: e.target.value })} /></div>
              <div><label htmlFor={`ls-rent-${rental.id}`} className={labelCls}>Monthly rent</label><input id={`ls-rent-${rental.id}`} type="number" step="0.01" min="0" className={fieldCls} value={leaseForm.monthlyRent} onChange={e => setLeaseForm({ ...leaseForm, monthlyRent: e.target.value })} /></div>
              <div><label htmlFor={`ls-dep-${rental.id}`} className={labelCls}>Deposit held</label><input id={`ls-dep-${rental.id}`} type="number" step="0.01" min="0" className={fieldCls} value={leaseForm.deposit} onChange={e => setLeaseForm({ ...leaseForm, deposit: e.target.value })} /></div>
              <div className="sm:col-span-2"><label htmlFor={`ls-late-${rental.id}`} className={labelCls}>Late-fee policy</label><input id={`ls-late-${rental.id}`} className={fieldCls} placeholder="e.g., $50 after the 5th, then $10/day" value={leaseForm.lateFeePolicy} onChange={e => setLeaseForm({ ...leaseForm, lateFeePolicy: e.target.value })} /></div>
              <div className="sm:col-span-3"><label htmlFor={`ls-url-${rental.id}`} className={labelCls}>Signed-lease URL (Google Drive, Dropbox, etc.)</label><input id={`ls-url-${rental.id}`} type="url" className={fieldCls} placeholder="https://..." value={leaseForm.signedDocURL} onChange={e => setLeaseForm({ ...leaseForm, signedDocURL: e.target.value })} /></div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-semibold mt-2">Tenant</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div><label htmlFor={`tn-name-${rental.id}`} className={labelCls}>Name</label><input id={`tn-name-${rental.id}`} className={fieldCls} value={tenantForm.name} onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })} /></div>
              <div><label htmlFor={`tn-phone-${rental.id}`} className={labelCls}>Phone</label><input id={`tn-phone-${rental.id}`} type="tel" className={fieldCls} placeholder="(217) 555-0100" value={tenantForm.phone} onChange={e => setTenantForm({ ...tenantForm, phone: e.target.value })} /></div>
              <div><label htmlFor={`tn-email-${rental.id}`} className={labelCls}>Email</label><input id={`tn-email-${rental.id}`} type="email" className={fieldCls} value={tenantForm.email} onChange={e => setTenantForm({ ...tenantForm, email: e.target.value })} /></div>
              <div><label htmlFor={`tn-movein-${rental.id}`} className={labelCls}>Move-in date</label><input id={`tn-movein-${rental.id}`} type="date" className={fieldCls} value={tenantForm.moveIn} onChange={e => setTenantForm({ ...tenantForm, moveIn: e.target.value })} /></div>
              <div><label htmlFor={`tn-ec-name-${rental.id}`} className={labelCls}>Emergency contact</label><input id={`tn-ec-name-${rental.id}`} className={fieldCls} value={tenantForm.emergencyContactName} onChange={e => setTenantForm({ ...tenantForm, emergencyContactName: e.target.value })} /></div>
              <div><label htmlFor={`tn-ec-phone-${rental.id}`} className={labelCls}>Emergency phone</label><input id={`tn-ec-phone-${rental.id}`} type="tel" className={fieldCls} value={tenantForm.emergencyContactPhone} onChange={e => setTenantForm({ ...tenantForm, emergencyContactPhone: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={saveLeaseTenant} className="bg-[#1A1815] text-white py-2 px-4 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save</button>
              <button type="button" onClick={() => setEditingLeaseTenant(false)} className="bg-white border border-[#1A1815] py-2 px-4 text-xs uppercase tracking-wider hover:bg-[#FAF8F4]">Cancel</button>
            </div>
          </div>
        )}
      </details>

      {/* EQUIPMENT */}
      <details className="bg-white border border-[#E8E4DC] p-3 mb-2">
        <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          Mechanical &amp; Equipment <span className="text-[10px] text-[#5A5751] ml-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {(rental.equipment || []).length}</span>
        </summary>
        <div className="mt-3 space-y-2">
          <button type="button" onClick={() => { setShowEquipForm(!showEquipForm); setEquipForm(blankEquip()); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showEquipForm ? '× Cancel' : '+ Add equipment'}</button>
          {showEquipForm && (
            <div className="bg-[#FAF8F4] border border-[#B85838] p-3 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div><label htmlFor={`eq-cat-${rental.id}`} className={labelCls}>Category</label><select id={`eq-cat-${rental.id}`} className={fieldCls} value={equipForm.category} onChange={e => setEquipForm({ ...equipForm, category: e.target.value })}>{EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label htmlFor={`eq-make-${rental.id}`} className={labelCls}>Make</label><input id={`eq-make-${rental.id}`} className={fieldCls} value={equipForm.make} onChange={e => setEquipForm({ ...equipForm, make: e.target.value })} /></div>
                <div><label htmlFor={`eq-model-${rental.id}`} className={labelCls}>Model</label><input id={`eq-model-${rental.id}`} className={fieldCls} value={equipForm.model} onChange={e => setEquipForm({ ...equipForm, model: e.target.value })} /></div>
                <div><label htmlFor={`eq-serial-${rental.id}`} className={labelCls}>Serial</label><input id={`eq-serial-${rental.id}`} className={fieldCls} value={equipForm.serial} onChange={e => setEquipForm({ ...equipForm, serial: e.target.value })} /></div>
                <div><label htmlFor={`eq-install-${rental.id}`} className={labelCls}>Installed</label><input id={`eq-install-${rental.id}`} type="date" className={fieldCls} value={equipForm.installDate} onChange={e => setEquipForm({ ...equipForm, installDate: e.target.value })} /></div>
                <div><label htmlFor={`eq-warr-${rental.id}`} className={labelCls}>Warranty end</label><input id={`eq-warr-${rental.id}`} type="date" className={fieldCls} value={equipForm.warrantyEnd} onChange={e => setEquipForm({ ...equipForm, warrantyEnd: e.target.value })} /></div>
              </div>
              <textarea className={fieldCls} rows="2" placeholder="Notes — manual link, last service date, quirks" value={equipForm.notes} onChange={e => setEquipForm({ ...equipForm, notes: e.target.value })} />
              <button type="button" onClick={addEquipment} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Equipment</button>
            </div>
          )}
          {(rental.equipment || []).length === 0 ? (
            <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No equipment recorded yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[9px] uppercase tracking-wider text-[#5A5751] border-b border-[#E8E4DC]">
                  <th scope="col" className="py-1 pr-2">Category</th>
                  <th scope="col" className="py-1 pr-2">Make / Model</th>
                  <th scope="col" className="py-1 pr-2">Serial</th>
                  <th scope="col" className="py-1 pr-2">Warranty</th>
                  <th scope="col" className="py-1"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {(rental.equipment || []).map(eq => (
                  <tr key={eq.id} className="border-b border-[#E8E4DC]" style={{ fontFamily: '"Fraunces", serif' }}>
                    <td className="py-1 pr-2">{eq.category}</td>
                    <td className="py-1 pr-2">{[eq.make, eq.model].filter(Boolean).join(' ') || '—'}</td>
                    <td className="py-1 pr-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{eq.serial || '—'}</td>
                    <td className="py-1 pr-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{eq.warrantyEnd || '—'}</td>
                    <td className="py-1 text-right"><button type="button" onClick={() => deleteEquipment(eq.id)} aria-label={`Delete ${eq.category} — ${eq.make || ''} ${eq.model || ''}`.trim()} className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>

      {/* ROOMS & NEEDED WORK */}
      <details className="bg-white border border-[#E8E4DC] p-3">
        <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          Rooms &amp; Needed Work <span className="text-[10px] text-[#5A5751] ml-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {(rental.rooms || []).length} rooms · {((rental.rooms || []).reduce((s, rm) => s + (rm.items || []).length, 0))} items</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[140px]">
              <label htmlFor={`rm-name-${rental.id}`} className={labelCls}>Add room</label>
              <input id={`rm-name-${rental.id}`} list={`rm-presets-${rental.id}`} className={fieldCls} placeholder="e.g., Kitchen" value={roomName} onChange={e => setRoomName(e.target.value)} />
              <datalist id={`rm-presets-${rental.id}`}>
                {ROOM_PRESETS.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <button type="button" onClick={addRoom} className="bg-[#1A1815] text-white py-2 px-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">+ Room</button>
          </div>
          {(rental.rooms || []).length === 0 ? (
            <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No rooms yet. Add a room above to start tracking needed work.</p>
          ) : (
            (rental.rooms || []).map(rm => (
              <div key={rm.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-2">
                {/* Primary action (+ Item) sits left-of-center; destructive (× Room)
                    is pushed right with a divider + larger tap target to prevent
                    accidental destructive taps next to the create action. */}
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{rm.name}</div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { setRoomItem({ roomId: rm.id, name: '', status: 'needs-work', notes: '' }); setShowRoomForm(true); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">+ Item</button>
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] mx-1" />
                    <button type="button" onClick={() => deleteRoom(rm.id)} aria-label={`Delete room ${rm.name}`} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-white px-3 py-2 min-h-[36px] border border-transparent hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">× Room</button>
                  </div>
                </div>
                {showRoomForm && roomItem.roomId === rm.id && (
                  <div className="bg-white border border-[#B85838] p-2 mb-2 space-y-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div><label htmlFor={`it-name-${rm.id}`} className={labelCls}>Item</label><input id={`it-name-${rm.id}`} list={`it-presets-${rm.id}`} className={fieldCls} placeholder="e.g., Plumbing — Sink" value={roomItem.name} onChange={e => setRoomItem({ ...roomItem, name: e.target.value })} /><datalist id={`it-presets-${rm.id}`}>{ROOM_ITEM_PRESETS.map(p => <option key={p} value={p} />)}</datalist></div>
                      <div><label htmlFor={`it-status-${rm.id}`} className={labelCls}>Status</label><select id={`it-status-${rm.id}`} className={fieldCls} value={roomItem.status} onChange={e => setRoomItem({ ...roomItem, status: e.target.value })}>{ROOM_ITEM_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
                      <div><label htmlFor={`it-notes-${rm.id}`} className={labelCls}>Notes (optional)</label><input id={`it-notes-${rm.id}`} className={fieldCls} value={roomItem.notes} onChange={e => setRoomItem({ ...roomItem, notes: e.target.value })} /></div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={addRoomItem} className="bg-[#1A1815] text-white py-1.5 px-3 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Item</button>
                      <button type="button" onClick={() => setShowRoomForm(false)} className="bg-white border border-[#1A1815] py-1.5 px-3 text-[10px] uppercase tracking-wider hover:bg-[#FAF8F4]">Cancel</button>
                    </div>
                  </div>
                )}
                {(rm.items || []).length === 0 ? (
                  <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No items yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {(rm.items || []).map(it => {
                      const stat = ROOM_ITEM_STATUSES.find(s => s.key === it.status) || ROOM_ITEM_STATUSES[1];
                      return (
                        <li key={it.id} className="flex items-center gap-2 text-xs py-1" style={{ fontFamily: '"Fraunces", serif' }}>
                          <span aria-hidden="true" className="inline-block w-5 text-center font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{stat.symbol}</span>
                          <span className="flex-1 min-w-0">{it.name}{it.notes ? <span className="text-[#5A5751] italic"> — {it.notes}</span> : ''}</span>
                          <label className="sr-only" htmlFor={`it-sel-${it.id}`}>Status for {it.name}</label>
                          <select id={`it-sel-${it.id}`} className="text-xs border border-[#E8E4DC] bg-white px-2 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={it.status} onChange={e => updateRoomItemStatus(rm.id, it.id, e.target.value)}>{ROOM_ITEM_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
                          <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] mx-1" />
                          <button type="button" onClick={() => { if (confirm(`Delete item "${it.name}"?`)) deleteRoomItem(rm.id, it.id); }} aria-label={`Delete ${it.name}`} className="text-xs text-[#5A5751] hover:text-[#B85838] hover:bg-white border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </details>
    </div>
  );
}

function Rentals({ rentals, entities, totals, snowballSort, setSnowballSort, snowballExtra, setSnowballExtra, rentalSnowball, sevenYearTarget, currentDate, addRental, updateRental, deleteRental, readOnly = false, incidents = [], addIncident, resolveIncident }) {
  // Round 10 — Tenant-late affordance helpers. Given a rental, find the open
  // incident already pointed at it (if any) so we don't double-track.
  const openIncidentFor = (r) => incidents.find(i => i.status !== 'resolved' && i.linkedTo?.type === 'rental' && i.linkedTo?.id === r.id);
  const openTenantIssue = (r, urgencyKey) => {
    if (!addIncident) return;
    const band = URGENCY_INDEX[urgencyKey] || URGENCY_INDEX.incident;
    addIncident({
      date: new Date().toISOString().slice(0, 10),
      amount: Math.max(0, (r.rent || 0) - (r.actual || 0)),
      category: 'tenant',
      entityId: r.entityId || 'e-poeprops',
      description: `Tenant at ${r.name} behind on rent (${fmt((r.rent || 0) - (r.actual || 0))} short)`,
      urgency: urgencyKey,
      status: 'open',
      dueDate: dueDateFor(urgencyKey),
      linkedTo: { type: 'rental', id: r.id },
    });
    alert(`Opened as ${band.label}. Due ${dueDateFor(urgencyKey)}. Track from Big Picture → Action Queue.`);
  };
  const rentalsWithCleared = rentals.map(r => { const cleared = rentalSnowball.activeProperties.find(p => p.id === r.id); return { ...r, clearedAtMonth: cleared?.clearedAtMonth }; });
  const orderedByPayoff = rentalsWithCleared.filter(r => r.clearedAtMonth).sort((a, b) => a.clearedAtMonth - b.clearedAtMonth);
  const sevenYrFeasible = rentalSnowball.allClearedYears <= 7;
  const gapMonthly = sevenYearTarget - snowballExtra;
  // v28+ Rentals expansion: add/edit property + autocomplete + map + evaluator
  const [showPropForm, setShowPropForm] = useState(false);
  const [editingPropId, setEditingPropId] = useState(null);
  const blankProp = () => ({ name: '', address: '', city: '', state: '', zip: '', tenantName: '', lat: null, lon: null, propertyType: 'single-family', rent: 0, status: 'paying', entityId: 'e-poeprops', purchasePrice: 0, purchaseDate: '', estimatedValue: 0, mortgageBalance: 0, mortgageRate: 6.5, monthlyPI: 0, escrow: 0, notes: '' });
  const [propForm, setPropForm] = useState(blankProp());
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimer = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Nominatim autocomplete - debounced 400ms, US-only, max 5 suggestions
  const fetchSuggestions = (q) => {
    clearTimeout(suggestTimer.current);
    if (!q || q.length < 3) { setSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&countrycodes=us&limit=5`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const json = await res.json();
        setSuggestions(Array.isArray(json) ? json : []);
      } catch (e) {
        console.warn('Nominatim error', e);
        setSuggestions([]);
      }
      setSuggestLoading(false);
    }, 400);
  };

  const pickSuggestion = (s) => {
    const a = s.address || {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    setPropForm(f => ({
      ...f,
      address: street || s.display_name.split(',')[0],
      city: a.city || a.town || a.village || a.hamlet || '',
      state: a.state || '',
      zip: a.postcode || '',
      lat: parseFloat(s.lat),
      lon: parseFloat(s.lon),
    }));
    setSuggestions([]);
  };

  // Leaflet map - lazy init when CDN loaded, refresh markers on rentals change
  useEffect(() => {
    if (typeof window === 'undefined' || !window.L || !mapRef.current) return;
    if (!mapInstanceRef.current) {
      const map = window.L.map(mapRef.current, { scrollWheelZoom: false }).setView([40.1164, -88.2434], 12);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
    }
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const withCoords = rentals.filter(r => typeof r.lat === 'number' && typeof r.lon === 'number');
    withCoords.forEach(r => {
      const marker = window.L.marker([r.lat, r.lon]).addTo(mapInstanceRef.current);
      marker.bindPopup(`<strong>${r.name}</strong><br/>${r.address || ''}${r.city ? ', ' + r.city : ''}<br/>Rent: $${r.rent}/mo · ${r.status}<br/>${r.mortgage?.balance ? 'Mortgage: $' + r.mortgage.balance.toLocaleString() : 'Paid off'}`);
      markersRef.current.push(marker);
    });
    if (withCoords.length > 0) {
      try { mapInstanceRef.current.fitBounds(window.L.featureGroup(markersRef.current).getBounds().pad(0.2)); } catch (e) {}
    }
  }, [rentals]);

  // Clean up map on unmount
  useEffect(() => () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } }, []);

  // Auto-evaluator - runs continuously off form inputs
  const evaluator = useMemo(() => {
    const price = parseFloat(propForm.purchasePrice) || 0;
    const rent = parseFloat(propForm.rent) || 0;
    const escrow = parseFloat(propForm.escrow) || 0;
    const monthlyPI = parseFloat(propForm.monthlyPI) || 0;
    const annualRent = rent * 12;
    const opex = (escrow * 12) + (annualRent * 0.10); // 10% maintenance/vacancy buffer
    const noi = annualRent - opex;
    const annualDS = monthlyPI * 12;
    const annualCF = noi - annualDS;
    const downPayment = price * 0.20; // assume 20% down
    return {
      annualRent, opex, noi, annualDS, annualCF, downPayment,
      capRate: price > 0 ? (noi / price) * 100 : 0,
      cashOnCash: downPayment > 0 ? (annualCF / downPayment) * 100 : 0,
      onePct: price > 0 ? (rent / price) * 100 : 0,
      grm: annualRent > 0 ? price / annualRent : 0,
      dscr: annualDS > 0 ? noi / annualDS : 0,
    };
  }, [propForm.purchasePrice, propForm.rent, propForm.escrow, propForm.monthlyPI]);

  // Round 7 fix: Edit no longer scrolls to top. The form renders inline under
  // the row being edited (drop-down style) — see renderPropertyRow's
  // {editingPropId === r.id && renderPropertyForm()} block below. Only "Add new"
  // uses the top form.
  const startAddProp = () => { setPropForm(blankProp()); setEditingPropId(null); setShowPropForm(true); setSuggestions([]); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} };
  const startEditProp = (r) => {
    setPropForm({
      name: r.name || '', address: r.address || '', city: r.city || '', state: r.state || '', zip: r.zip || '',
      tenantName: r.tenantName || '',
      lat: r.lat ?? null, lon: r.lon ?? null,
      propertyType: r.propertyType || 'single-family',
      rent: r.rent || 0, status: r.status || 'paying', entityId: r.entityId || 'e-poeprops',
      purchasePrice: r.purchasePrice || 0, purchaseDate: r.purchaseDate || '', estimatedValue: r.estimatedValue || 0,
      mortgageBalance: r.mortgage?.balance || 0, mortgageRate: r.mortgage?.rate || 6.5,
      monthlyPI: r.mortgage?.monthlyPI || 0, escrow: r.mortgage?.escrow || 0,
      notes: r.notes || '',
    });
    setEditingPropId(r.id); setShowPropForm(false); setSuggestions([]);
    // NO scroll — inline form opens right under the row, eyes stay where you tapped.
  };
  const cancelPropForm = () => { setShowPropForm(false); setEditingPropId(null); setSuggestions([]); };

  const submitProp = () => {
    if (!propForm.name || !propForm.address) { alert('Property name and address are required.'); return; }
    const payload = {
      name: propForm.name,
      address: propForm.address, city: propForm.city, state: propForm.state, zip: propForm.zip,
      tenantName: propForm.tenantName,
      lat: propForm.lat, lon: propForm.lon,
      propertyType: propForm.propertyType,
      rent: parseFloat(propForm.rent) || 0,
      actual: parseFloat(propForm.rent) || 0,
      status: propForm.status,
      entityId: propForm.entityId,
      purchasePrice: parseFloat(propForm.purchasePrice) || 0,
      purchaseDate: propForm.purchaseDate,
      estimatedValue: parseFloat(propForm.estimatedValue) || 0,
      mortgage: {
        balance: parseFloat(propForm.mortgageBalance) || 0,
        rate: parseFloat(propForm.mortgageRate) || 0,
        monthlyPI: parseFloat(propForm.monthlyPI) || 0,
        escrow: parseFloat(propForm.escrow) || 0,
        estimated: false,
      },
      notes: propForm.notes,
    };
    if (editingPropId) updateRental(editingPropId, payload);
    else addRental(payload);
    cancelPropForm();
  };
  const confirmDeleteProp = (r) => { if (confirm(`Delete property "${r.name}"? Snowball math will recompute without it.`)) deleteRental(r.id); };

  // v28+ Maintenance trio: per-property records (maintenance log + conversations)
  // Stored on the rental record itself. All local, zero ongoing cost.
  const MAINT_CATEGORIES = ['roof','plumbing','hvac','electrical','appliance','exterior','interior','lawn','pest','flooring','windows','general','other'];
  const [openRecordsId, setOpenRecordsId] = useState(null); // which property's records are expanded
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showConvForm, setShowConvForm] = useState(false);
  // Round 10 — Maintenance entries carry an ITSM urgency band so the family
  // can triage at a glance. Defaults to 'incident' (3-day window).
  const blankMaint = () => ({ date: new Date().toISOString().slice(0,10), category: 'general', urgency: 'incident', description: '', cost: 0, vendor: '', notes: '', photos: [] });
  const blankConv = () => ({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const [maintForm, setMaintForm] = useState(blankMaint());
  const [convForm, setConvForm] = useState(blankConv());

  // Compress an image File to a JPEG data URL (max width 1200, quality 0.7).
  // Returns a Promise<string>. Typical receipt photo lands at 80-200 KB.
  const compressImageFile = (file, maxWidth = 1200, quality = 0.7) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const onMaintPhotoFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const compressed = [];
    for (const file of Array.from(fileList)) {
      try { compressed.push(await compressImageFile(file)); } catch (e) { console.warn('Image compress failed', e); }
    }
    setMaintForm(f => ({ ...f, photos: [...(f.photos || []), ...compressed] }));
  };

  const openRecords = (r) => { setOpenRecordsId(r.id === openRecordsId ? null : r.id); setShowMaintForm(false); setShowConvForm(false); setMaintForm(blankMaint()); setConvForm(blankConv()); };
  const addMaintEntry = (r) => {
    if (!maintForm.description) { alert('Description is required.'); return; }
    const entry = { ...maintForm, id: `mt-${Date.now()}`, cost: parseFloat(maintForm.cost) || 0 };
    updateRental(r.id, { maintenanceLog: [...(r.maintenanceLog || []), entry] });
    setMaintForm(blankMaint()); setShowMaintForm(false);
  };
  const addConvEntry = (r) => {
    if (!convForm.summary) { alert('Summary is required.'); return; }
    const entry = { ...convForm, id: `cv-${Date.now()}` };
    updateRental(r.id, { conversationLog: [...(r.conversationLog || []), entry] });
    setConvForm(blankConv()); setShowConvForm(false);
  };
  const deleteMaintEntry = (r, entryId) => {
    if (!confirm('Delete this maintenance entry? Photos and receipt info will be lost.')) return;
    updateRental(r.id, { maintenanceLog: (r.maintenanceLog || []).filter(e => e.id !== entryId) });
  };
  const deleteConvEntry = (r, entryId) => {
    if (!confirm('Delete this conversation note?')) return;
    updateRental(r.id, { conversationLog: (r.conversationLog || []).filter(e => e.id !== entryId) });
  };
  // v28+ Bug fix: side-by-side strategy comparison so user can see the delta even when small
  const strategyOptions = [
    { id: 'smallest-balance', label: 'Smallest balance', sub: 'Momentum' },
    { id: 'highest-rate',     label: 'Highest rate',     sub: 'Math optimum' },
    { id: 'best-cashflow',    label: 'Best cash flow',   sub: 'Strong earners' },
  ];
  const strategyComparison = useMemo(() => {
    const runs = strategyOptions.map(s => {
      const r = projectRentalSnowball(rentals, snowballExtra, s.id, currentDate, 240);
      return { ...s, totalInterest: r.totalInterest, allClearedYears: r.allClearedYears, allClearedMonth: r.allClearedMonth };
    });
    const cheapest = Math.min(...runs.map(r => r.totalInterest));
    return runs.map(r => ({ ...r, delta: r.totalInterest - cheapest, isCheapest: r.totalInterest === cheapest }));
  }, [rentals, snowballExtra, currentDate]);
  const allRatesEqual = rentals.length > 1 && rentals.every(r => r.mortgage.rate === rentals[0].mortgage.rate);
  return (
    <div className="space-y-8">
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">The 7-Year Pattern</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Six years to build. The seventh year to rest.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>Own each property outright within seven years, so the seventh year is real rest.</p>
      </section>
      <section>
        <SectionTitle>11 Doors · Poe Properties LLC</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mb-4">
          <MetricCell label="Mortgage debt" value={fmtCompact(totals.totalRentalDebt)} sub="est." small accent="rust" />
          <MetricCell label="Monthly P&I" value={fmt(totals.totalRentalPI)} small />
          <MetricCell label="Monthly rent" value={fmt(totals.rentalExpected)} sub={`${totals.collectionRate.toFixed(0)}%`} small accent="green" />
          <MetricCell label="Rent gap" value={fmt(totals.rentGap)} small accent={totals.rentGap > 0 ? 'rust' : 'green'} />
        </div>
      </section>
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Properties · {rentals.length}</h2>
          <button type="button" onClick={() => showPropForm ? cancelPropForm() : startAddProp()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showPropForm ? '× Cancel' : '+ Add property'}</button>
        </div>

        {/* Round 7 — Top form is for ADD only. When editing, the same form
            renders inline inside the row being edited via {propFormBlock} below. */}
        {showPropForm && !editingPropId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">{editingPropId ? 'Edit property' : 'New property · address autocomplete via OpenStreetMap'}</div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Address (start typing — suggestions appear)</label>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="123 Main St, Champaign" value={propForm.address} onChange={e => { setPropForm({ ...propForm, address: e.target.value }); fetchSuggestions(e.target.value); }} />
              {suggestLoading && <div className="text-[10px] text-[#5A5751] italic mt-1">Searching...</div>}
              {suggestions.length > 0 && (
                <div className="border border-[#E8E4DC] bg-white mt-1 max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => pickSuggestion(s)} className="block w-full text-left p-2 text-xs hover:bg-[#FAF8F4] border-b border-[#E8E4DC]" style={{ fontFamily: '"Fraunces", serif' }}>
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Property name</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., 805 Apt 1" value={propForm.name} onChange={e => setPropForm({ ...propForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">City</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.city} onChange={e => setPropForm({ ...propForm, city: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">State</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.state} onChange={e => setPropForm({ ...propForm, state: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Zip</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.zip} onChange={e => setPropForm({ ...propForm, zip: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Current tenant name (optional)</label>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Tracy Williams — leave blank for personal or vacant" value={propForm.tenantName} onChange={e => setPropForm({ ...propForm, tenantName: e.target.value })} />
              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>If set, the tenant name shows on the property card. Property name (address) stays the property's primary label.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Property type</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.propertyType} onChange={e => setPropForm({ ...propForm, propertyType: e.target.value })}>
                  {['single-family','multi-family','commercial','condo','townhouse','duplex','primary-home','secondary-home','vacation','land','other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly rent</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.rent} onChange={e => setPropForm({ ...propForm, rent: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.status} onChange={e => setPropForm({ ...propForm, status: e.target.value })}>
                  {['paying','late','vacant','rehab','for-sale','sold','owner-occupied','seasonal','unrented'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.entityId} onChange={e => setPropForm({ ...propForm, entityId: e.target.value })}>
                  {entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Purchase price</label>
                <input type="number" step="100" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.purchasePrice} onChange={e => setPropForm({ ...propForm, purchasePrice: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Purchase date</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.purchaseDate} onChange={e => setPropForm({ ...propForm, purchaseDate: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Est. value (today)</label>
                <input type="number" step="100" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.estimatedValue} onChange={e => setPropForm({ ...propForm, estimatedValue: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Mortgage balance</label>
                <input type="number" step="100" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.mortgageBalance} onChange={e => setPropForm({ ...propForm, mortgageBalance: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Mortgage rate %</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.mortgageRate} onChange={e => setPropForm({ ...propForm, mortgageRate: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly P&I</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.monthlyPI} onChange={e => setPropForm({ ...propForm, monthlyPI: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Escrow / mo</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.escrow} onChange={e => setPropForm({ ...propForm, escrow: e.target.value })} />
              </div>
            </div>

            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes (tenant, history, repairs needed, etc.)" value={propForm.notes} onChange={e => setPropForm({ ...propForm, notes: e.target.value })} />

            {/* Auto-evaluator */}
            <div className="bg-[#FAF8F4] border border-[#1A1815] p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">Auto-Evaluator · Live as you type</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Cap rate</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.capRate.toFixed(2)}%</div>
                  <div className={`text-[9px] ${evaluator.capRate >= 8 ? 'text-[#5A6E3D]' : evaluator.capRate >= 5 ? 'text-[#5A5751]' : 'text-[#B85838]'}`}>{evaluator.capRate >= 8 ? 'Strong' : evaluator.capRate >= 5 ? 'OK' : 'Weak'}</div>
                </div>
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Cash-on-cash</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.cashOnCash.toFixed(2)}%</div>
                  <div className={`text-[9px] ${evaluator.cashOnCash >= 10 ? 'text-[#5A6E3D]' : evaluator.cashOnCash >= 6 ? 'text-[#5A5751]' : 'text-[#B85838]'}`}>{evaluator.cashOnCash >= 10 ? 'Strong' : evaluator.cashOnCash >= 6 ? 'OK' : 'Weak'}</div>
                </div>
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">1% rule</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.onePct.toFixed(2)}%</div>
                  <div className={`text-[9px] ${evaluator.onePct >= 1 ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>{evaluator.onePct >= 1 ? '✓ pass' : '✗ below 1%'}</div>
                </div>
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">DSCR</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.dscr.toFixed(2)}</div>
                  <div className={`text-[9px] ${evaluator.dscr >= 1.25 ? 'text-[#5A6E3D]' : evaluator.dscr >= 1 ? 'text-[#5A5751]' : 'text-[#B85838]'}`}>{evaluator.dscr >= 1.25 ? 'Lender OK' : evaluator.dscr >= 1 ? 'Tight' : 'Below 1'}</div>
                </div>
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">GRM</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.grm.toFixed(1)}</div>
                  <div className="text-[9px] text-[#5A5751]">lower = better</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mt-2">
                <div className="bg-white p-2"><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Annual rent</div><div className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(evaluator.annualRent)}</div></div>
                <div className="bg-white p-2"><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">NOI</div><div className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(evaluator.noi)}</div></div>
                <div className="bg-white p-2"><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Annual debt service</div><div className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(evaluator.annualDS)}</div></div>
                <div className="bg-white p-2"><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Annual cash flow</div><div className={`text-sm ${evaluator.annualCF < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(evaluator.annualCF)}</div></div>
              </div>
              <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                Cap rate = NOI ÷ purchase price. Cash-on-cash assumes 20% down. 1% rule = monthly rent ÷ purchase price. DSCR = NOI ÷ annual debt service (lenders want ≥ 1.25). GRM = price ÷ annual rent. NOI uses your escrow plus a 10% maintenance/vacancy buffer; refine the buffer in your head for the property type.
              </p>
            </div>

            <button type="button" onClick={submitProp} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingPropId ? 'Save Changes' : 'Save Property'}</button>
          </div>
        )}

        {(() => {
          const incomeProducing = rentals.filter(r => (r.rent || 0) > 0);
          const personal = rentals.filter(r => (r.rent || 0) === 0);
          const renderPropertyRow = (r, i, lastIdx) => {
            // Round 10 — Tenant-late surfacing. If status is 'late', show a
            // tenant-issue card with one-tap "Open as Change / Incident / Project"
            // buttons. If an open issue already exists, show its band + Resolve.
            const existingIssue = r.status === 'late' && !readOnly ? openIncidentFor(r) : null;
            const showLatePrompt = r.status === 'late' && !readOnly && !existingIssue;
            return (
                <div key={r.id} className={`p-4 ${i < lastIdx ? 'border-b border-[#E8E4DC]' : ''}`}>
                  {showLatePrompt && addIncident && (
                    <div className="mb-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838]">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
                        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">⚐ Tenant Not Paying · open this as</div>
                        <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{fmt((r.rent || 0) - (r.actual || 0))} short</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {URGENCY_BANDS.map(u => (
                          <button key={u.key} type="button" onClick={() => openTenantIssue(r, u.key)} className="text-[10px] uppercase tracking-wider px-3 py-2 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ color: u.accent, borderColor: u.accent }}>
                            <span aria-hidden="true">{u.symbol}</span> {u.label} <span className="opacity-70 normal-case">· {u.tagline}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                        Change = same-day action. Incident = 3-day resolution window. Project = formal eviction / multi-week plan. The chosen item shows on Big Picture → Action Queue with a due date.
                      </p>
                    </div>
                  )}
                  {existingIssue && (
                    <div className="mb-3 p-3 bg-white border border-[#B85838] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base" aria-hidden="true" style={{ color: URGENCY_INDEX[existingIssue.urgency]?.accent }}>{URGENCY_INDEX[existingIssue.urgency]?.symbol}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: URGENCY_INDEX[existingIssue.urgency]?.accent }}>{URGENCY_INDEX[existingIssue.urgency]?.label}</span>
                        <span className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>open · due {existingIssue.dueDate}</span>
                      </div>
                      {resolveIncident && (
                        <button type="button" onClick={() => resolveIncident(existingIssue.id)} className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✓ Mark resolved</button>
                      )}
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.name}</div>
                      <div className="text-xs text-[#5A5751]">
                        {[r.address, r.city, r.state, r.zip].filter(Boolean).join(', ') || 'no address yet'}
                        {r.propertyType && <span className="ml-2 uppercase tracking-wider text-[9px]">· {r.propertyType}</span>}
                      </div>
                      {r.tenantName && (
                        <div className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                          👤 <strong>{r.tenantName}</strong>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {(r.rent || 0) > 0 ? (
                        <>
                          <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(r.rent)}<span className="text-xs text-[#5A5751]">/mo</span></div>
                          <div className={`text-[10px] uppercase tracking-wider ${r.status === 'late' ? 'text-[#B85838]' : r.status === 'vacant' ? 'text-[#B85838]' : 'text-[#5A5751]'}`}>{r.status}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{r.status || 'personal'}</div>
                          {r.mortgage?.monthlyPI ? <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt((r.mortgage?.monthlyPI || 0) + (r.mortgage?.escrow || 0))}/mo PITI</div> : null}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                    <div><span className="text-[#5A5751]">Mortgage:</span> <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.mortgage?.balance ? fmt(r.mortgage.balance) : 'paid off'}</span></div>
                    <div><span className="text-[#5A5751]">Rate:</span> <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.mortgage?.rate ? r.mortgage.rate + '%' : '—'}</span></div>
                    <div><span className="text-[#5A5751]">P&I:</span> <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.mortgage?.monthlyPI ? fmt(r.mortgage.monthlyPI) : '—'}</span></div>
                    <div><span className="text-[#5A5751]">Coords:</span> {typeof r.lat === 'number' ? <span className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.lat.toFixed(3)}, {r.lon.toFixed(3)}</span> : <button type="button" onClick={() => startEditProp(r)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline">📍 Set address</button>}</div>
                  </div>
                  <div className="flex gap-2 mt-2 items-baseline flex-wrap">
                    <button type="button" onClick={() => editingPropId === r.id ? cancelPropForm() : startEditProp(r)} aria-expanded={editingPropId === r.id} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingPropId === r.id ? '× Cancel edit' : '✎ Edit'}</button>
                    <button type="button" onClick={() => openRecords(r)} className="text-xs uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
                      {openRecordsId === r.id ? '× Close records' : `📋 Records (${(r.maintenanceLog || []).length} maint · ${(r.conversationLog || []).length} notes)`}
                    </button>
                    {(r.maintenanceLog || []).length > 0 && (
                      <span className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        Lifetime maint: {fmt((r.maintenanceLog || []).reduce((s, e) => s + (e.cost || 0), 0))}
                      </span>
                    )}
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] ml-auto" />
                    <button type="button" onClick={() => confirmDeleteProp(r)} aria-label={`Delete property ${r.name}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
                  </div>
                  {r.notes && <p className="text-[11px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{r.notes}</p>}

                  {/* Round 7 — Inline quick-edit form drops down right under the property row.
                      Covers the common-edit fields (name · address · tenant · rent · status · notes
                      · monthly P&I · mortgage balance). For the full editor (purchase price,
                      cap-rate evaluator, address autocomplete) tap "Full editor ↗" — opens the
                      top form. Keeps the eye where it was, no jump-to-top. */}
                  {editingPropId === r.id && (
                    <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838]">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium mb-2">Quick edit · {r.name}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div><label htmlFor={`qe-name-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Property name</label><input id={`qe-name-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.name} onChange={e => setPropForm({ ...propForm, name: e.target.value })} /></div>
                        <div><label htmlFor={`qe-addr-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Address</label><input id={`qe-addr-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.address} onChange={e => setPropForm({ ...propForm, address: e.target.value })} /></div>
                        <div><label htmlFor={`qe-tenant-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Tenant name</label><input id={`qe-tenant-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.tenantName} onChange={e => setPropForm({ ...propForm, tenantName: e.target.value })} /></div>
                        <div><label htmlFor={`qe-rent-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly rent</label><input id={`qe-rent-${r.id}`} type="number" step="0.01" min="0" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.rent} onChange={e => setPropForm({ ...propForm, rent: e.target.value })} /></div>
                        <div><label htmlFor={`qe-stat-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label><select id={`qe-stat-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.status} onChange={e => setPropForm({ ...propForm, status: e.target.value })}>{['paying','late','vacant','rehab','for-sale','sold','owner-occupied','seasonal','unrented'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div><label htmlFor={`qe-ent-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select id={`qe-ent-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.entityId} onChange={e => setPropForm({ ...propForm, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
                        <div><label htmlFor={`qe-mtg-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Mortgage balance</label><input id={`qe-mtg-${r.id}`} type="number" step="100" min="0" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.mortgageBalance} onChange={e => setPropForm({ ...propForm, mortgageBalance: e.target.value })} /></div>
                        <div><label htmlFor={`qe-pi-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly P&amp;I</label><input id={`qe-pi-${r.id}`} type="number" step="0.01" min="0" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.monthlyPI} onChange={e => setPropForm({ ...propForm, monthlyPI: e.target.value })} /></div>
                      </div>
                      <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-white mt-2 focus:outline focus:outline-2 focus:outline-[#B85838]" rows="2" placeholder="Notes" value={propForm.notes} onChange={e => setPropForm({ ...propForm, notes: e.target.value })} />
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <button type="button" onClick={submitProp} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                        <button type="button" onClick={cancelPropForm} className="border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                        <button type="button" onClick={() => { setShowPropForm(true); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline ml-auto focus:outline focus:outline-2 focus:outline-[#B85838]">Full editor ↗ (purchase price · evaluator · address autocomplete)</button>
                      </div>
                    </div>
                  )}

                  {openRecordsId === r.id && (
                    <div className="mt-3 pt-3 border-t border-[#E8E4DC] space-y-4">
                      {/* v28+ MVP v1.5: lease/tenant/equipment/rooms — Real Estate App carryover */}
                      <PropertyDetails rental={r} updateRental={updateRental} />
                      {/* MAINTENANCE LOG */}
                      <div>
                        <div className="flex items-baseline justify-between gap-2 mb-2">
                          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔧 Maintenance Log · {(r.maintenanceLog || []).length}</div>
                          <button type="button" onClick={() => { setShowMaintForm(!showMaintForm); setMaintForm(blankMaint()); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showMaintForm ? '× Cancel' : '+ Add entry'}</button>
                        </div>
                        {showMaintForm && (
                          <div className="bg-white border border-[#B85838] p-3 mb-2 space-y-2">
                            {/* Round 10 — Urgency band picker. Change / Incident / Project.
                                Defaults to Incident (3-day resolution window). Picking Change
                                stamps a same-day due. Picking Project surfaces a hint about
                                also opening a formal project record. */}
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Urgency</label>
                              <div className="flex flex-wrap gap-1">
                                {URGENCY_BANDS.map(u => (
                                  <button key={u.key} type="button" onClick={() => setMaintForm({ ...maintForm, urgency: u.key })} className={`text-[10px] uppercase tracking-wider px-3 py-2 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]`} style={maintForm.urgency === u.key ? { backgroundColor: u.accent, color: 'white', borderColor: u.accent } : { color: u.accent, borderColor: u.accent }}>
                                    <span aria-hidden="true">{u.symbol}</span> {u.label} <span className="opacity-70 normal-case">· {u.tagline}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label>
                                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={maintForm.date} onChange={e => setMaintForm({ ...maintForm, date: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Category</label>
                                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={maintForm.category} onChange={e => setMaintForm({ ...maintForm, category: e.target.value })}>
                                  {MAINT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Cost</label>
                                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={maintForm.cost} onChange={e => setMaintForm({ ...maintForm, cost: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Vendor</label>
                                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Reyes Roofing" value={maintForm.vendor} onChange={e => setMaintForm({ ...maintForm, vendor: e.target.value })} />
                              </div>
                            </div>
                            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="What was done? (required)" value={maintForm.description} onChange={e => setMaintForm({ ...maintForm, description: e.target.value })} />
                            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes · warranty · parts numbers" value={maintForm.notes} onChange={e => setMaintForm({ ...maintForm, notes: e.target.value })} />
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">📷 Receipts / photos</label>
                              <input type="file" accept="image/*" multiple capture="environment" onChange={e => onMaintPhotoFiles(e.target.files)} className="block w-full text-xs file:mr-2 file:px-2 file:py-1 file:bg-[#1A1815] file:text-white file:border-0 file:uppercase file:tracking-wider file:text-[10px] file:cursor-pointer" />
                              {(maintForm.photos || []).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {maintForm.photos.map((src, i) => (
                                    <div key={i} className="relative">
                                      <img src={src} alt={`Receipt ${i+1}`} className="w-20 h-20 object-cover border border-[#1A1815]" />
                                      <button type="button" onClick={() => setMaintForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))} className="absolute -top-1 -right-1 bg-[#B85838] text-white text-[10px] w-4 h-4 leading-4 text-center rounded-full">×</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Images are compressed to ~1200px JPEG before saving locally. No upload, no server.</p>
                            </div>
                            <button type="button" onClick={() => addMaintEntry(r)} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Maintenance Entry</button>
                          </div>
                        )}
                        {(r.maintenanceLog || []).length === 0 && !showMaintForm ? (
                          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No maintenance entries yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {[...(r.maintenanceLog || [])].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                              <div key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-2">
                                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] flex items-center gap-1.5 flex-wrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                                      {e.urgency && URGENCY_INDEX[e.urgency] && (
                                        <span className="px-1.5 py-0.5 border text-[9px] uppercase tracking-wider font-semibold" style={{ color: URGENCY_INDEX[e.urgency].accent, borderColor: URGENCY_INDEX[e.urgency].accent }} title={URGENCY_INDEX[e.urgency].tagline}>
                                          {URGENCY_INDEX[e.urgency].symbol} {URGENCY_INDEX[e.urgency].label}
                                        </span>
                                      )}
                                      <span>{e.date} · <span className="uppercase tracking-wider">{e.category}</span>{e.vendor ? ` · ${e.vendor}` : ''}</span>
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.description}</div>
                                    {e.notes && <div className="text-[11px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.notes}</div>}
                                  </div>
                                  <div className="flex items-baseline gap-2 shrink-0">
                                    <div className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmt(e.cost || 0)}</div>
                                    <button type="button" onClick={() => deleteMaintEntry(r, e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                                  </div>
                                </div>
                                {(e.photos || []).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {e.photos.map((src, i) => (
                                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" title="Open full size">
                                        <img src={src} alt={`Photo ${i+1}`} className="w-16 h-16 object-cover border border-[#E8E4DC] hover:border-[#1A1815]" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CONVERSATION LOG */}
                      <div>
                        <div className="flex items-baseline justify-between gap-2 mb-2">
                          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">💬 Tenant & Vendor Conversations · {(r.conversationLog || []).length}</div>
                          <button type="button" onClick={() => { setShowConvForm(!showConvForm); setConvForm(blankConv()); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showConvForm ? '× Cancel' : '+ Log a conversation'}</button>
                        </div>
                        {showConvForm && (
                          <div className="bg-white border border-[#B85838] p-3 mb-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label>
                                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={convForm.date} onChange={e => setConvForm({ ...convForm, date: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Who</label>
                                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., tenant Tracy, plumber Joe" value={convForm.person} onChange={e => setConvForm({ ...convForm, person: e.target.value })} />
                              </div>
                            </div>
                            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Summary (required) — e.g., 'agreed to $200/mo payment plan on rent gap'" value={convForm.summary} onChange={e => setConvForm({ ...convForm, summary: e.target.value })} />
                            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes · tone · next step · promises made" value={convForm.notes} onChange={e => setConvForm({ ...convForm, notes: e.target.value })} />
                            <button type="button" onClick={() => addConvEntry(r)} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Conversation Note</button>
                          </div>
                        )}
                        {(r.conversationLog || []).length === 0 && !showConvForm ? (
                          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No conversation notes yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {[...(r.conversationLog || [])].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                              <div key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-2">
                                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{e.date}{e.person ? ` · ${e.person}` : ''}</div>
                                    <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.summary}</div>
                                    {e.notes && <div className="text-[11px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.notes}</div>}
                                  </div>
                                  <button type="button" onClick={() => deleteConvEntry(r, e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
          );
          };
          return (
            <div className="space-y-4">
              {rentals.length === 0 && (
                <div className="bg-white border border-[#E8E4DC] p-6 text-center">
                  <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No properties yet. Use + Add property above.</p>
                </div>
              )}
              {incomeProducing.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Income-Producing · {incomeProducing.length}</div>
                  <div className="bg-white border border-[#1A1815]">
                    {incomeProducing.map((r, i) => renderPropertyRow(r, i, incomeProducing.length - 1))}
                  </div>
                </div>
              )}
              {personal.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Personal & Non-Rental · {personal.length}</div>
                  <div className="bg-white border border-[#1A1815]">
                    {personal.map((r, i) => renderPropertyRow(r, i, personal.length - 1))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>

      <section>
        <SectionTitle>Snowball Strategy</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-5 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Payoff order</div>
            <div className="grid grid-cols-3 gap-1">
              {[['smallest-balance','Smallest','Momentum'],['highest-rate','Highest rate','Math optimum'],['best-cashflow','Best cash flow','Strong earners']].map(([id, label, sub]) => (
                <button key={id} onClick={() => setSnowballSort(id)} className={`px-2 py-2 text-left border ${snowballSort === id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                  <div className="text-xs" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{label}</div>
                  <div className="text-[9px] uppercase tracking-wider opacity-75">{sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Monthly snowball</div>
                <div className="text-[10px] text-[#5A5751] mt-0.5">Total mortgage debt: <strong>{fmtCompact(rentals.reduce((s, r) => s + r.mortgage.balance, 0))}</strong> across {rentals.length} properties · P&I: <strong>{fmt(rentals.reduce((s, r) => s + r.mortgage.monthlyPI, 0))}/mo</strong></div>
              </div>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(snowballExtra)}</div>
            </div>
            <input type="range" min="0" max="20000" step="250" value={snowballExtra} onChange={(e) => setSnowballExtra(parseInt(e.target.value))} className="w-full accent-[#B85838]" />
            <details className="mt-2">
              <summary className="text-[10px] uppercase tracking-wider text-[#B85838] cursor-pointer hover:text-[#1A1815]">▸ Show individual property balances</summary>
              <div className="mt-2 space-y-1 text-xs">
                {[...rentals].sort((a, b) => b.mortgage.balance - a.mortgage.balance).slice(0, 11).map(r => (
                  <div key={r.id} className="flex justify-between border-b border-[#E8E4DC] pb-1">
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{r.address} <span className="text-[#5A5751]">· {r.mortgage.rate}%</span></span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(r.mortgage.balance)}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
          <div className="grid grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="All paid in" value={yearsAndMonths(rentalSnowball.allClearedMonth)} small />
            <MetricCell label="Interest" value={fmt(rentalSnowball.totalInterest)} small />
            <MetricCell label="Final freed" value={fmt(rentalSnowball.finalFreedCashFlow)} small accent="green" />
          </div>
        </div>
      </section>
      <section>
        <SectionTitle>7-Year Goal · Feasibility</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-5">
          {sevenYrFeasible ? <p style={{ fontFamily: '"Fraunces", serif' }}>At {fmt(snowballExtra)}/mo snowball, all 11 doors pay off in <strong>{rentalSnowball.allClearedYears.toFixed(1)} years</strong>.</p> : <p style={{ fontFamily: '"Fraunces", serif' }}>At {fmt(snowballExtra)}/mo: cascade completes in <strong>{rentalSnowball.allClearedYears.toFixed(1)} years</strong>. 7-year goal needs <strong>{fmt(sevenYearTarget)}/mo</strong> — gap of <strong>{fmt(gapMonthly)}/mo</strong>.</p>}
        </div>
      </section>
      <section>
        <SectionTitle>Strategy Comparison</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-5">
          <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
            All three strategies side by side at your current ${'{'}fmt(snowballExtra){'}'}/mo snowball. Differences show up most in <em>payoff order</em> (which property clears first) and <em>cash flow timing</em>, less so in total interest when mortgage rates are similar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            {strategyComparison.map(s => (
              <div key={s.id} className={`p-4 ${s.id === snowballSort ? 'bg-[#FAF8F4]' : 'bg-white'}`}>
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">{s.label}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#5A5751] opacity-75">{s.sub}</div>
                  </div>
                  {s.id === snowballSort && <span className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">Selected</span>}
                </div>
                <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(s.totalInterest)}</div>
                <div className="text-[10px] text-[#5A5751] mt-0.5">total interest</div>
                <div className={`text-[10px] mt-1 ${s.isCheapest ? 'text-[#5A6E3D] font-semibold' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {s.isCheapest ? '✓ cheapest' : `+${fmt(s.delta)}`}
                </div>
                <div className="text-[10px] text-[#5A5751] mt-2 pt-2 border-t border-[#E8E4DC]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  All clear: {s.allClearedYears.toFixed(1)} yrs
                </div>
              </div>
            ))}
          </div>
          {allRatesEqual && (
            <p className="text-[11px] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
              All 11 rentals are seeded at the same mortgage rate ({rentals[0].mortgage.rate}%), so "Highest rate" doesn't differentiate from the others. Once you enter the actual per-property rates the spread widens — strategy choice will matter more.
            </p>
          )}
        </div>
      </section>
      <section>
        <SectionTitle>Payoff Cascade</SectionTitle>
        <div className="bg-white border border-[#1A1815]">
          {orderedByPayoff.map((r, i) => {
            const freedSoFar = orderedByPayoff.slice(0, i + 1).reduce((s, x) => s + x.mortgage.monthlyPI, 0);
            return (
              <div key={r.id} className={`p-4 ${i < orderedByPayoff.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="text-[#B85838] shrink-0 w-8 text-center" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.name}</div>
                      <div className="text-sm text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{monthLabel(currentDate, r.clearedAtMonth)}</div>
                    </div>
                    <div className="text-xs text-[#5A5751] mt-1">Paid in {yearsAndMonths(r.clearedAtMonth)} · {fmt(r.mortgage.balance)} · Frees {fmt(r.mortgage.monthlyPI)}/mo</div>
                    <div className="text-xs text-[#5A6E3D] mt-1">Snowball after: <strong>{fmt(snowballExtra + freedSoFar)}/mo</strong></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle>Property Map · Champaign-Urbana</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-3">
          <div ref={mapRef} style={{ height: '360px', width: '100%' }} aria-label="Map of rental properties" />
          <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Pins appear for properties with saved coordinates. Use Edit on a property to add an address — the autocomplete fills coordinates automatically.
          </p>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// v28+ MVP v1.5 — MARKETS · Watchlist with free Stooq CSV feed.
// "One-stop place for financial data" — anyone can add their main tickers.
// Cost: $0 (no API key, no signup, public CORS-friendly endpoint).
// Stooq symbol format: 'aapl.us', 'spy.us', 'btcusd', 'eurusd', '^spx'.
// CSV columns: Symbol,Date,Time,Open,High,Low,Close,Volume.
// WCAG 2.1 AA: <label> for inputs, aria-live updates, change direction
// expressed as text+symbol (not color alone), refresh button has aria-busy.
// =============================================================================
const SUGGESTED_TICKERS = [
  { sym: 'spy.us',  label: 'S&P 500 ETF' },
  { sym: 'qqq.us',  label: 'Nasdaq 100 ETF' },
  { sym: 'dia.us',  label: 'Dow Jones ETF' },
  { sym: 'iwm.us',  label: 'Russell 2000 ETF' },
  { sym: 'vti.us',  label: 'Total US Market' },
  { sym: 'aapl.us', label: 'Apple' },
  { sym: 'msft.us', label: 'Microsoft' },
  { sym: 'nvda.us', label: 'Nvidia' },
  { sym: 'btcusd',  label: 'Bitcoin / USD' },
  { sym: 'ethusd',  label: 'Ethereum / USD' },
  { sym: 'eurusd',  label: 'EUR / USD' },
  { sym: '^spx',    label: 'S&P 500 Index' },
];

function Markets({ watchlist, addWatchlistSymbol, removeWatchlistSymbol, userTier, setView, maxWatchlist = Infinity }) {
  const atCap = watchlist.length >= maxWatchlist;
  const capLabel = isFinite(maxWatchlist) ? maxWatchlist : null;
  // No pre-population — show empty cells until the Stooq fetch resolves.
  const [quotes, setQuotes] = useState({}); // sym -> {date,time,open,high,low,close,volume,changePct,error}
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Round 13 fix — Stooq's CSV endpoint doesn't send CORS headers, so direct
  // browser fetches silently fail. Routes through corsproxy.io (free, no API
  // key, no signup, supports https). Falls back to a second public proxy if
  // the first one is down. If both fail, the user gets a clear error message.
  const fetchQuote = async (sym) => {
    const stooqUrl = `https://stooq.com/q/l/?s=${encodeURIComponent(sym)}&f=sd2t2ohlcv&h&e=csv`;
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(stooqUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(stooqUrl)}`,
    ];
    let lastErr = '';
    for (const url of proxies) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }
        const text = await res.text();
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) { lastErr = 'empty response'; continue; }
        const cols = lines[1].split(',');
        // Stooq returns "N/D" for unknown symbols
        if (cols.includes('N/D') || cols[3] === 'N/D') return { error: 'symbol not found' };
        const [Symbol, Date_, Time_, Open, High, Low, Close, Volume] = cols;
        const open = parseFloat(Open), close = parseFloat(Close);
        if (!isFinite(open) || !isFinite(close)) { lastErr = 'unparseable response'; continue; }
        const changePct = open > 0 ? ((close - open) / open) * 100 : 0;
        return { sym: (Symbol || sym).toLowerCase(), date: Date_, time: Time_, open, high: parseFloat(High), low: parseFloat(Low), close, volume: parseFloat(Volume) || 0, changePct };
      } catch (e) {
        lastErr = e.message || 'network error';
      }
    }
    return { error: lastErr || 'network error' };
  };

  // Refresh all symbols in parallel.
  const refresh = async () => {
    if (!watchlist || watchlist.length === 0) { setQuotes({}); setLastUpdated(new Date()); return; }
    setLoading(true);
    setGlobalError('');
    const results = await Promise.all(watchlist.map(async s => [s, await fetchQuote(s)]));
    const next = {};
    let anySuccess = false;
    for (const [s, q] of results) { next[s] = q; if (!q.error) anySuccess = true; }
    setQuotes(next);
    setLastUpdated(new Date());
    setLoading(false);
    if (!anySuccess && watchlist.length > 0) {
      // Show the actual error from the first failed quote so user can diagnose.
      const firstError = results.find(([, q]) => q.error)?.[1]?.error || 'unknown';
      setGlobalError(`Couldn't reach the market data feed (${firstError}). The app routes Stooq quotes through a public CORS proxy (corsproxy.io → allorigins.win fallback). Common causes: (1) browser blocked by ad/script blocker, allow corsproxy.io; (2) the proxy is rate-limited — try Refresh in 30s; (3) offline. Watchlist still saves locally either way.`);
    }
  };

  // Initial fetch + auto-refresh every 60s. Re-runs when the watchlist changes.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist.join('|')]);

  const handleAdd = (e) => {
    e && e.preventDefault && e.preventDefault();
    const s = (input || '').trim().toLowerCase();
    if (!s) { setInputError('Enter a symbol — e.g., aapl.us, spy.us, btcusd.'); return; }
    if (!/^[a-z0-9.\-^]+$/.test(s)) { setInputError('Symbol can only contain letters, digits, dot, dash, or ^.'); return; }
    if (watchlist.includes(s)) { setInputError(`${s} is already on your watchlist.`); return; }
    if (atCap) { setInputError(`Foundation tier holds ${capLabel} tickers. Upgrade to PoeTech+ for unlimited.`); return; }
    setInputError('');
    addWatchlistSymbol(s);
    setInput('');
  };

  // Format helpers
  const fmtPrice = (v) => v == null || isNaN(v) ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const fmtVol = (v) => !v ? '—' : v >= 1e9 ? `${(v/1e9).toFixed(2)}B` : v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : v >= 1e3 ? `${(v/1e3).toFixed(1)}K` : `${v}`;
  const fmtPct = (p) => p == null || isNaN(p) ? '—' : `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-medium">Markets · Watchlist</div>
        <h2 className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>One place for your financial data.</h2>
        <p className="text-sm leading-relaxed mt-2 text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Add the tickers you actually watch — indices, ETFs, individual stocks, crypto, FX. Quotes refresh automatically every minute. Free data: <a href="https://stooq.com" target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">stooq.com</a> · routed through <a href="https://corsproxy.io" target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">corsproxy.io</a> (Stooq doesn't send browser CORS headers directly). No API key, no signup, no cost.
        </p>
      </section>

      {/* Add form */}
      <section aria-labelledby="add-ticker-h">
        <h3 id="add-ticker-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Add a ticker</h3>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="ticker-input" className="text-[9px] uppercase tracking-wider text-[#5A5751]">Symbol (Stooq format)</label>
            <input
              id="ticker-input"
              list="ticker-suggestions"
              value={input}
              onChange={e => { setInput(e.target.value); setInputError(''); }}
              placeholder="e.g., aapl.us · btcusd · ^spx"
              className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'ticker-input-error' : undefined}
            />
            <datalist id="ticker-suggestions">
              {SUGGESTED_TICKERS.map(t => <option key={t.sym} value={t.sym}>{t.label}</option>)}
            </datalist>
          </div>
          <button type="submit" className="bg-[#1A1815] text-white py-2 px-4 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">+ Add</button>
        </form>
        {inputError && <p id="ticker-input-error" role="alert" className="text-xs text-[#B85838] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{inputError}</p>}
        <div className="mt-3">
          <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Quick add</div>
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_TICKERS.filter(t => !watchlist.includes(t.sym)).map(t => (
              <button key={t.sym} type="button" onClick={() => addWatchlistSymbol(t.sym)} className="px-2 py-1 text-[10px] border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
                <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.sym}</span> <span className="text-[#5A5751]">· {t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Watchlist */}
      <section aria-labelledby="watchlist-h">
        <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h3 id="watchlist-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Watchlist · {watchlist.length} {watchlist.length === 1 ? 'ticker' : 'tickers'}</h3>
          <div className="flex items-baseline gap-3 text-[10px] uppercase tracking-wider">
            {lastUpdated && <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }} aria-live="polite">updated {lastUpdated.toLocaleTimeString()}</span>}
            <button type="button" onClick={refresh} aria-busy={loading} className="text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" disabled={loading}>{loading ? 'Refreshing…' : '↻ Refresh'}</button>
          </div>
        </div>
        {globalError && (
          <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 mb-2">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">⚠ Market data fetch failed</div>
            <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{globalError}</p>
          </div>
        )}
        {watchlist.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No tickers on your watchlist yet. Use the Quick add buttons above to start.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#1A1815] overflow-x-auto" aria-live="polite">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[9px] uppercase tracking-wider text-[#5A5751] border-b border-[#1A1815] bg-[#FAF8F4]">
                  <th scope="col" className="p-3">Symbol</th>
                  <th scope="col" className="p-3 text-right">Last</th>
                  <th scope="col" className="p-3 text-right">Day change</th>
                  <th scope="col" className="p-3 text-right hidden sm:table-cell">Open</th>
                  <th scope="col" className="p-3 text-right hidden sm:table-cell">High</th>
                  <th scope="col" className="p-3 text-right hidden sm:table-cell">Low</th>
                  <th scope="col" className="p-3 text-right hidden md:table-cell">Volume</th>
                  <th scope="col" className="p-3 text-right hidden md:table-cell">As of</th>
                  <th scope="col" className="p-3 text-right"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((sym, i) => {
                  const q = quotes[sym] || {};
                  const isErr = !!q.error;
                  const hasData = !isErr && q.close !== undefined;
                  const up = hasData && q.changePct >= 0;
                  const directionText = hasData ? (q.changePct >= 0 ? 'up' : 'down') : '';
                  return (
                    <tr key={sym} className={`border-b border-[#E8E4DC] ${i % 2 === 1 ? 'bg-[#FAF8F4]' : ''}`} style={{ fontFamily: '"Fraunces", serif' }}>
                      <td className="p-3" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{sym.toUpperCase()}</td>
                      <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtPrice(q.close)}</td>
                      <td className={`p-3 text-right ${isErr ? 'text-[#5A5751]' : up ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {isErr ? (
                          <span title={q.error}>—</span>
                        ) : (
                          <>
                            <span aria-hidden="true">{up ? '▲ ' : '▼ '}</span>
                            <span className="sr-only">{directionText} </span>
                            {fmtPct(q.changePct)}
                          </>
                        )}
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtPrice(q.open)}</td>
                      <td className="p-3 text-right hidden sm:table-cell" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtPrice(q.high)}</td>
                      <td className="p-3 text-right hidden sm:table-cell" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtPrice(q.low)}</td>
                      <td className="p-3 text-right hidden md:table-cell text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? '—' : fmtVol(q.volume)}</td>
                      <td className="p-3 text-right hidden md:table-cell text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{isErr ? <span title={q.error}>error</span> : `${q.date || ''} ${q.time || ''}`}</td>
                      <td className="p-3 text-right">
                        <button type="button" onClick={() => removeWatchlistSymbol(sym)} aria-label={`Remove ${sym.toUpperCase()} from watchlist`} className="text-base text-[#5A5751] hover:text-[#B85838] hover:bg-white border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Day change is computed from open vs. last (intraday). Quotes are delayed by the data source and meant for awareness — not for executing trades. The change column shows direction in text (up / down) and symbol (▲ / ▼) in addition to color, so the meaning carries through for screen readers and color-blind users (WCAG 2.1 AA).
        </p>
      </section>
    </div>
  );
}

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
      {/* HEADER */}
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
function Inbound({ voiceOps = {}, setVoiceOpsConfig, addIncident, addInquiry, addProject, entities = [], setView }) {
  const configured = !!(voiceOps.apiUrl && voiceOps.apiToken);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetched, setLastFetched] = useState(null);
  const [filterLine, setFilterLine] = useState('all');
  const [filterStatus, setFilterStatus] = useState('new');
  // Config form state (only shown when not configured yet, or via gear)
  const [showConfig, setShowConfig] = useState(!configured);
  const [cfgUrl, setCfgUrl] = useState(voiceOps.apiUrl || '');
  const [cfgToken, setCfgToken] = useState(voiceOps.apiToken || '');
  // Per-row "convert" form state (only one row open at a time)
  const [convertOpen, setConvertOpen] = useState(null); // row.id
  const [convertAs, setConvertAs] = useState('incident'); // 'incident' | 'inquiry' | 'project'
  const [convertNote, setConvertNote] = useState('');
  const [convertEntity, setConvertEntity] = useState(entities[0]?.id || 'e-personal');

  const apiUrl = (voiceOps.apiUrl || '').replace(/\/$/, '');
  const token = voiceOps.apiToken || '';

  const fetchInbound = async () => {
    if (!configured) return;
    setLoading(true); setError('');
    try {
      const url = `${apiUrl}/inbound?status=${encodeURIComponent(filterStatus)}${filterLine !== 'all' ? `&line=${encodeURIComponent(filterLine)}` : ''}&limit=100`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} — ${body.slice(0, 200) || 'no body'}`);
      }
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setLastFetched(new Date());
    } catch (e) {
      setError(e.message || 'network error');
    }
    setLoading(false);
  };
  // Auto-fetch on mount + when filters change, refresh every 5 minutes.
  useEffect(() => {
    if (!configured) return;
    fetchInbound();
    const id = setInterval(fetchInbound, 5 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, filterLine, filterStatus, apiUrl, token]);

  const saveConfig = () => {
    if (!cfgUrl.trim() || !cfgToken.trim()) { alert('Both API endpoint and token are required.'); return; }
    setVoiceOpsConfig({ apiUrl: cfgUrl.trim(), apiToken: cfgToken.trim() });
    setShowConfig(false);
  };

  const markHandled = async (row, handledAs) => {
    try {
      await fetch(`${apiUrl}/inbound/${row.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'handled', handled_as: handledAs, handled_note: convertNote }),
      });
    } catch (e) {
      console.warn('mark-handled failed', e);
    }
    fetchInbound();
  };

  const submitConvert = (row) => {
    const ent = convertEntity || (row.line === 'poe-properties' ? 'e-poeprops' : 'e-poetech');
    const desc = (row.transcript || `Voicemail from ${row.caller || 'unknown'}`) + (convertNote ? `\n\n${convertNote}` : '');
    if (convertAs === 'incident') {
      addIncident && addIncident({
        date: new Date().toISOString().slice(0, 10),
        amount: 0,
        category: row.line === 'poe-properties' ? 'tenant-or-property' : 'business',
        entityId: ent,
        description: `📞 ${row.caller || 'unknown'} — ${desc.slice(0, 200)}`,
        urgency: 'incident',
        status: 'open',
        dueDate: '',
      });
    } else if (convertAs === 'inquiry') {
      addInquiry && addInquiry({
        firstName: '(from voicemail)',
        lastName: row.caller || '',
        phone: row.caller || '',
        email: '',
        source: 'inbound-voicemail',
        interest: 'voicemail-intake',
        bestTime: 'anytime',
        notes: desc,
      });
    } else if (convertAs === 'project') {
      const today = new Date().toISOString().slice(0, 10);
      addProject && addProject({
        title: `Inbound: ${(row.caller || 'unknown')} · ${row.line}`,
        startDate: today,
        endDate: '',
        status: 'planning',
        domain: row.line === 'poe-properties' ? 'real-estate' : 'business-poetech',
        description: desc,
        hoursPerWeek: 2,
        entityId: ent,
        contractorIds: [],
        conversationLog: [{ id: `cv-${Date.now()}`, date: today, person: row.caller || 'inbound voicemail', summary: 'Origin voicemail', notes: row.transcript || '' }],
      });
    }
    markHandled(row, convertAs);
    setConvertOpen(null); setConvertNote(''); setConvertAs('incident');
    if (setView) {
      const target = convertAs === 'inquiry' ? 'practice' : convertAs === 'project' ? 'projects' : 'overview';
      setView(target);
    }
  };

  const lineLabel = (l) => l === 'poe-properties' ? 'Poe Properties' : l === 'poetech' ? 'PoeTech' : l || '—';

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-medium">Inbound · Voicemails &amp; Call Notes</div>
        <h2 className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>What came in while you were busy.</h2>
        <p className="text-sm leading-relaxed mt-2 text-[#5A5751] max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Phase 1 routing for Poe Properties + PoeTech business lines. Each voicemail is auto-transcribed by Twilio, stored in your own Cloudflare Worker (free tier), and shown here for triage. Convert each one into an Incident, Practice Inquiry, or Project — the original recording stays archived. <strong>TLC is not routed here</strong> — that line keeps its current setup until the Phase 3 HIPAA-clean stack ships. <a href="https://github.com/darrellpoe06/Kingdom-PWA-Node/blob/main/backend/voice-worker/README.md" target="_blank" rel="noopener noreferrer" className="underline text-[#B85838]">Setup runbook →</a>
        </p>
      </section>

      {/* CONFIG FORM */}
      {(!configured || showConfig) && (
        <section aria-labelledby="cfg-h" className="bg-[#FAF8F4] border-2 border-[#B85838] p-4">
          <h3 id="cfg-h" className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">{configured ? 'Edit endpoint &amp; token' : 'First-time setup'}</h3>
          <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Paste your Cloudflare Worker URL + the <code>PWA_API_TOKEN</code> you generated in the deploy runbook (steps 4b and 5). Both saved locally on this device — never sent anywhere except your own Worker.
          </p>
          <div className="space-y-2">
            <div>
              <label htmlFor="cfg-url" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">API endpoint URL</label>
              <input id="cfg-url" type="url" placeholder="https://api.poetech.us  or  https://poetech-voice-ops.YOUR-SUB.workers.dev" className="w-full p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={cfgUrl} onChange={e => setCfgUrl(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cfg-token" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">API token (PWA_API_TOKEN)</label>
              <input id="cfg-token" type="password" placeholder="Paste the token you set in wrangler secret put PWA_API_TOKEN" className="w-full p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={cfgToken} onChange={e => setCfgToken(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap pt-1">
              <button type="button" onClick={saveConfig} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save &amp; connect</button>
              {configured && <button type="button" onClick={() => setShowConfig(false)} className="border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>}
            </div>
          </div>
        </section>
      )}

      {/* INBOUND LIST */}
      {configured && (
        <section aria-labelledby="ib-list-h">
          <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
            <h3 id="ib-list-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Inbox · {rows.length} {filterStatus === 'new' ? 'new' : filterStatus}</h3>
            <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-wider">
              <div className="flex gap-1">
                {[['all','All lines'],['poe-properties','Poe Properties'],['poetech','PoeTech']].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setFilterLine(k)} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${filterLine === k ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{l}</button>
                ))}
              </div>
              <span aria-hidden="true" className="h-4 w-px bg-[#E8E4DC]" />
              <div className="flex gap-1">
                {[['new','New'],['handled','Handled'],['all','All']].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setFilterStatus(k)} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${filterStatus === k ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{l}</button>
                ))}
              </div>
              <span aria-hidden="true" className="h-4 w-px bg-[#E8E4DC]" />
              {lastFetched && <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>updated {lastFetched.toLocaleTimeString()}</span>}
              <button type="button" onClick={fetchInbound} disabled={loading} aria-busy={loading} className="text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{loading ? 'Refreshing…' : '↻ Refresh'}</button>
              <button type="button" onClick={() => setShowConfig(true)} className="text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" title="Edit endpoint">⚙ Config</button>
            </div>
          </div>

          {error && (
            <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 mb-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">⚠ Couldn't reach the Voice Ops backend</div>
              <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{error}</p>
              <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Common causes: wrong URL / token (⚙ Config), Worker not deployed, CORS blocked. Verify with <code>curl {apiUrl}/healthz</code>.</p>
            </div>
          )}

          {rows.length === 0 && !loading && !error && (
            <div className="bg-white border border-[#E8E4DC] p-6 text-center">
              <div className="text-2xl mb-1" aria-hidden="true">📭</div>
              <p className="text-sm text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>No {filterStatus === 'new' ? 'new' : filterStatus} voicemails.</p>
              <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Live calls auto-appear here within ~5 minutes of the voicemail ending.</p>
            </div>
          )}

          {rows.length > 0 && (
            <div className="bg-white border border-[#1A1815]">
              {rows.map((r, i) => {
                const isOpen = convertOpen === r.id;
                const created = r.created_at ? new Date(r.created_at).toLocaleString() : '';
                return (
                  <div key={r.id} className={`p-4 ${i < rows.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                    <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: r.line === 'poe-properties' ? '#B85838' : '#1F6FEB' }}>{lineLabel(r.line)}</span>
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.caller || 'unknown caller'}</span>
                        {r.caller_name && <span className="text-xs text-[#5A5751]">({r.caller_name})</span>}
                        {r.status === 'handled' && <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D]">✓ {r.handled_as || 'handled'}{r.handled_at ? ` · ${new Date(r.handled_at).toLocaleDateString()}` : ''}</span>}
                      </div>
                      <div className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{created}{r.voicemail_dur_sec ? ` · ${r.voicemail_dur_sec}s` : ''}</div>
                    </div>
                    {r.transcript ? (
                      <p className="text-sm bg-[#FAF8F4] border-l-2 border-[#B85838] p-2 my-2" style={{ fontFamily: '"Fraunces", serif' }}>{r.transcript}</p>
                    ) : (
                      <p className="text-xs text-[#5A5751] italic my-2" style={{ fontFamily: '"Fraunces", serif' }}>No transcript available (audio only).</p>
                    )}
                    {r.voicemail_url && (
                      <audio controls preload="none" src={r.voicemail_url} className="w-full mt-1" />
                    )}
                    {r.handled_note && (
                      <p className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Handle note: {r.handled_note}</p>
                    )}
                    {r.status !== 'handled' && (
                      <div className="mt-3">
                        {!isOpen ? (
                          <button type="button" onClick={() => { setConvertOpen(r.id); setConvertAs(r.line === 'poe-properties' ? 'incident' : 'inquiry'); }} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#1A1815] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Convert this voicemail →</button>
                        ) : (
                          <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Convert into what?</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {[['incident','! Incident','3-day to-do · adds to Action Queue'],['inquiry','📋 Practice Inquiry','adds to Practice pipeline'],['project','◆ Project','multi-day · capacity-aware']].map(([k, label, hint]) => (
                                <button key={k} type="button" onClick={() => setConvertAs(k)} className="text-left p-2 border min-h-[56px] focus:outline focus:outline-2 focus:outline-[#B85838]" style={convertAs === k ? { backgroundColor: '#1A1815', color: 'white', borderColor: '#1A1815' } : { borderColor: '#E8E4DC' }}>
                                  <div className="text-xs uppercase tracking-wider font-semibold">{label}</div>
                                  <div className="text-[10px] opacity-90 mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{hint}</div>
                                </button>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label htmlFor={`ib-ent-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Entity</label>
                                <select id={`ib-ent-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={convertEntity} onChange={e => setConvertEntity(e.target.value)}>
                                  {entities.map(e => <option key={e.id} value={e.id}>{e.name.split('(')[0].trim()}</option>)}
                                </select>
                              </div>
                              <div>
                                <label htmlFor={`ib-note-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Additional note (optional)</label>
                                <input id={`ib-note-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="Context the transcript missed" value={convertNote} onChange={e => setConvertNote(e.target.value)} />
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap pt-1">
                              <button type="button" onClick={() => submitConvert(r)} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Convert + mark handled</button>
                              <button type="button" onClick={() => markHandled(r, 'discarded')} className="border border-[#5A5751] text-[#5A5751] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#FAF8F4] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Discard (not actionable)</button>
                              <button type="button" onClick={() => { setConvertOpen(null); setConvertNote(''); }} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] px-3 py-2 focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-[#5A5751] italic mt-3 max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
            Auto-refreshes every 5 minutes when this tab is open. Raw recording + transcript stay in your Cloudflare D1 database after conversion — searchable for audit. TLC voicemails are never routed through this Worker; the Studio flow on the TLC line should post to a separate HIPAA-clean endpoint when Phase 3 ships.
          </p>
        </section>
      )}
    </div>
  );
}

function BooksEntities({ entityRollups, entityFilter, setEntityFilter, data }) {
  const visible = entityFilter === 'all' ? entityRollups : entityRollups.filter(r => r.entity.id === entityFilter);
  return (
    <div className="space-y-6">
      <section><SectionTitle>Entities</SectionTitle><div className="flex gap-1 flex-wrap text-xs"><button type="button" onClick={() => setEntityFilter('all')} className={`px-3 py-1.5 border ${entityFilter === 'all' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>All</button>{data.entities.map(e => <button key={e.id} onClick={() => setEntityFilter(e.id)} className={`px-3 py-1.5 border ${entityFilter === e.id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{e.name.split('(')[0].trim()}</button>)}</div></section>
      {visible.map((r) => (
        <section key={r.entity.id} className="bg-white border border-[#1A1815] p-5">
          <h3 className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.entity.name}</h3>
          <div className="text-xs text-[#5A5751] mt-0.5 mb-3">{r.entity.notes}</div>
          {/* Round 12 fix — Cash tile now uses cashBalance (cash+savings+investment only),
              not the all-account sum that included credit-card negatives. Added a Credit
              tile so credit/loan balances surface here too without polluting Cash. */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Cash" value={fmt(r.cashBalance)} small accent={r.cashBalance < 0 ? 'rust' : 'green'} sub="spendable" />
            <MetricCell label="Credit" value={fmt(r.creditBalance)} small accent={r.creditBalance < 0 ? 'rust' : null} sub="cards + loans" />
            <MetricCell label="Inflow" value={fmt(r.inflow)} small sub="per mo" />
            <MetricCell label="Debt total" value={fmt(r.debtBalance)} small accent={r.debtBalance > 0 ? 'rust' : null} sub="from Debts tab" />
            <MetricCell label="Accounts" value={`${r.accounts.length}`} small sub="all types" />
          </div>
        </section>
      ))}
    </div>
  );
}

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'loan', 'investment', 'cash', 'other'];

function BooksAccounts({ entityRollups, entities, addAccount, updateAccount, deleteAccount, bufferTarget = 0, bufferCurrent = 0, setBufferCurrent, setBufferTarget, totals = {} }) {
  // v28+ MVP v1.5 round 4 — Buffer target editing is deliberate (modal-style),
  // current balance is slider-driven (continuous, live feedback).
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState(bufferTarget);
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
  const liquidTotal = allAccounts.filter(a => ['checking','savings','cash','investment'].includes(a.type)).reduce((s, a) => s + (a.balance || 0), 0);
  const creditTotal = allAccounts.filter(a => a.type === 'credit' || a.type === 'loan').reduce((s, a) => s + (a.balance || 0), 0);
  const debtAccountsCount = allAccounts.filter(a => a.type === 'credit' || a.type === 'loan').length;
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
          Add the checking, savings, credit, and loan accounts that hold the household's cash flow. Each account belongs to an entity (Personal, Poe Properties, PoeTech, TLC). Balances feed every rollup, projection, and the funds-available check on upcoming transactions.
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
            <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{allAccounts.filter(a => ['checking','savings','cash','investment'].includes(a.type)).length} cash accounts</div>
            <div className={`text-3xl ${liquidTotal < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>{fmt(liquidTotal)}</div>
          </div>
          <p className="text-[10px] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Credit cards and loans are tracked separately below — they're not cash you can spend, so mixing them here distorted the math.
          </p>
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

      {/* Round 8 — Debt Accounts Total summary card (only shown if any debts exist).
          Moved here from the All Accounts Total area at the top so cash and debt
          are clearly separated. Per-entity drill-down follows below. */}
      {debtAccountsCount > 0 && (
        <section aria-labelledby="debt-accounts-total-h" className="bg-[#FAF8F4] border border-[#1A1815] p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div>
              <h2 id="debt-accounts-total-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Debt Accounts · Total</h2>
              <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>Credit cards + loans across all entities. Detailed payoff strategy lives in the <strong>Debts</strong> tab.</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{debtAccountsCount} debt {debtAccountsCount === 1 ? 'account' : 'accounts'}</div>
              <div className={`text-2xl ${creditTotal < 0 ? 'text-[#B85838]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>{fmt(creditTotal)}</div>
            </div>
          </div>
        </section>
      )}

      {/* Round 4 — Bank accounts are PRIMARY (top, prominent border + larger heading).
          Credit cards & loans are SECONDARY (below, lighter treatment) so the eye
          lands on the cash that's actually available to spend, not the debt. */}
      {entityRollups.map(r => {
        const bankAccounts = r.accounts.filter(a => ['checking','savings','cash','investment'].includes(a.type));
        const creditAccounts = r.accounts.filter(a => ['credit','loan'].includes(a.type));
        const otherAccounts = r.accounts.filter(a => !['checking','savings','cash','investment','credit','loan'].includes(a.type));
        const bankTotal = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);
        const creditTotal = creditAccounts.reduce((s, a) => s + (a.balance || 0), 0);
        const renderRow = (a, i, arr) => (
          <div key={a.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
            <div className="flex justify-between items-baseline gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{a.name}</span>
                <span className="text-xs text-[#5A5751] ml-2">{a.institution} {a.fragment}</span>
                <span className="text-[9px] uppercase tracking-wider text-[#5A5751] ml-2">{a.type}</span>
                {a.isPrimary && <span className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold ml-2">★ primary</span>}
              </div>
              <div className={`text-right ${a.balance < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(a.balance)}</div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button type="button" onClick={() => editingId === a.id ? cancel() : startEdit(a)} aria-expanded={editingId === a.id} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingId === a.id ? '× Cancel edit' : '✎ Edit'}</button>
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

            {/* SECONDARY: Credit Cards & Loans */}
            {creditAccounts.length > 0 && (
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">💳 Credit Cards &amp; Loans <span className="text-[9px] normal-case font-normal italic">· secondary</span></h4>
                  <div className={`text-xs ${creditTotal < 0 ? 'text-[#B85838]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{creditAccounts.length} · {fmt(creditTotal)}</div>
                </div>
                <div className="bg-white border border-[#E8E4DC]">
                  {creditAccounts.map((a, i) => renderRow(a, i, creditAccounts))}
                </div>
              </div>
            )}

            {/* OTHER (cash/other types) — only if present */}
            {otherAccounts.length > 0 && (
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1.5">Other Accounts</h4>
                <div className="bg-white border border-[#E8E4DC]">
                  {otherAccounts.map((a, i) => renderRow(a, i, otherAccounts))}
                </div>
              </div>
            )}

            {r.accounts.length === 0 && (
              <div className="bg-white border border-[#E8E4DC] p-3 text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No accounts yet for this entity. Use + Add account above.</div>
            )}
          </section>
        );
      })}
    </div>
  );
}

const TX_CATEGORIES = ['salary', 'rental-income', 'transfer', 'groceries', 'fuel', 'utilities', 'dining', 'medical', 'vehicle', 'household', 'charitable', 'business', 'professional', 'insurance', 'subscription', 'debt-payment', 'other'];

function BooksTransactions({ data, entityFilter, setEntityFilter, currentDate, addTransaction, updateTransaction, deleteTransaction }) {
  const [txView, setTxView] = useState('history');
  const [page, setPage] = useState(0);
  const pageSize = 25;
  useEffect(() => { setPage(0); }, [txView, entityFilter]);

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
  const startEdit = (t) => { setForm({ date: t.date, accountId: t.accountId, amount: t.amount, description: t.description, category: t.category || 'other', entityOverride: t.entityOverride || '' }); setEditingId(t.id); setShowForm(true); };
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

  const matchesEntity = (t) => {
    if (entityFilter === 'all') return true;
    if (t.entityOverride) return t.entityOverride === entityFilter;
    const acc = data.accounts.find(a => a.id === t.accountId);
    return acc && acc.entityId === entityFilter;
  };

  const allTx = (data.transactions || []).filter(matchesEntity);
  const history = allTx.filter(t => t.date <= todayISO).sort((a, b) => b.date.localeCompare(a.date));
  const futureTx = allTx.filter(t => t.date > todayISO).sort((a, b) => a.date.localeCompare(b.date));

  const recurringUpcoming = (data.recurringObligations || [])
    .filter(r => r.enabled !== false && r.nextDue && r.nextDue > todayISO)
    .map(r => {
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
    const accLabel = acc ? `${acc.name}${acc.fragment ? ' ' + acc.fragment : ''}` : (t._source === 'recurring' ? 'Recurring obligation' : '—');
    const currentBal = acc ? balanceByAccount[acc.id] : null;
    const afterBal = txView === 'upcoming' && acc && projectedAfter[t.id] !== undefined ? projectedAfter[t.id] : null;
    return (
      <tr key={t.id} className="border-b border-[#E8E4DC] align-top">
        <td className="p-2 text-xs whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.date.slice(5)}</td>
        <td className="p-2">
          <div style={{ fontFamily: '"Fraunces", serif' }}>{t.description}</div>
          <div className="text-[10px] text-[#5A5751] mt-0.5">
            <span>{accLabel}</span>
            {currentBal !== null && <span className={`ml-1 ${currentBal < 0 ? 'text-[#B85838]' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>(now {fmt(currentBal)})</span>}
            {t.category && <span className="ml-2 uppercase tracking-wider">· {t.category}</span>}
            {t._source === 'recurring' && <span className="ml-2 text-[#B85838] uppercase tracking-wider">· recurring · {t._frequency}</span>}
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
          {t._source !== 'recurring' && (
            <span className="inline-flex items-center gap-1">
              <button type="button" onClick={() => startEdit(t)} aria-label={`Edit transaction ${t.description}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ Edit</button>
              <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
              <button type="button" onClick={() => confirmDelete(t)} aria-label={`Delete transaction ${t.description}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
            </span>
          )}
        </td>
      </tr>
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
            {data.entities.map(e => <button key={e.id} onClick={() => setEntityFilter(e.id)} className={`px-3 py-1.5 border ${entityFilter === e.id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{e.name.split('(')[0].trim()}</button>)}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCsvOpen(true)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">📤 Import CSV</button>
            <button type="button" onClick={() => showForm ? cancel() : startAdd()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add transaction'}</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">{editingId ? 'Edit transaction' : 'New transaction'}</div>
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
        const srcProjected = src ? (projectedAfter[transferContext.txId] !== undefined ? src.balance : src.balance) : 0; // simplified - just use current
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

function ThousandNinetyNine({ contractors }) {
  const outbound = contractors.filter(c => c.direction === 'outbound');
  const inbound = contractors.filter(c => c.direction === 'inbound');
  return (<div className="space-y-6"><section><SectionTitle>1099 Relationships</SectionTitle></section><section><h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Outbound</h3><div className="bg-white border border-[#1A1815]">{outbound.map((c, i) => (<div key={c.id} className={`p-4 ${i < outbound.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}><div className="flex justify-between"><div><div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{c.name}</div><div className="text-xs text-[#5A5751]">{c.role}</div></div><div className="text-right"><div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(c.ytdPaid)}</div><div className="text-[10px] uppercase tracking-wider text-[#5A5751]">YTD</div></div></div></div>))}</div></section><section><h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Inbound</h3><div className="bg-white border border-[#1A1815]">{inbound.map((c, i) => (<div key={c.id} className={`p-4 ${i < inbound.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}><div className="flex justify-between"><div><div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{c.name}</div><div className="text-xs text-[#5A5751]">{c.role}</div></div><div className="text-right"><div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(c.ytdReceived)}</div><div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{fmt(c.monthlyExpected)}/mo</div></div></div></div>))}</div></section></div>);
}

function Pressure({ pressure, setPressure, totals, pressureCalc, reserves, projection }) {
  return (<div className="space-y-8"><section><SectionTitle>Pressure Slider</SectionTitle><div className="bg-white border border-[#1A1815] p-5"><div className="flex items-baseline justify-between mb-2"><div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Current</div><div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{pressure}/10</div></div><input type="range" min="1" max="10" step="1" value={pressure} onChange={(e) => setPressure(parseInt(e.target.value))} className="w-full accent-[#B85838] mb-2" /><div className="flex justify-between text-[10px] uppercase tracking-wider text-[#5A5751]"><span>Loose</span><span>Moderate</span><span>Sprint</span></div><div className="mt-6 pt-6 border-t border-[#E8E4DC]"><div className="text-4xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 400 }}>{projection.debtFreeYears.toFixed(1)} years</div><div className="text-sm text-[#5A5751] mt-1">to consumer debt freedom</div></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] mt-6 border border-[#E8E4DC]"><MetricCell label="Gross" value={fmt(pressureCalc.grossAvailable)} small /><MetricCell label="Reserves" value={fmt(pressureCalc.reservesDeducted)} small accent="rust" /><MetricCell label="To debt" value={fmt(pressureCalc.extraAvailable)} small /><MetricCell label="Rent capture" value={fmt(pressureCalc.rentCapture)} small /></div></div></section></div>);
}

function Debts({ debts, entities, debtSnowballSort, setDebtSnowballSort, debtSnowballExtra, setDebtSnowballExtra, debtSnowball, debtMinOnly, currentDate, netCashFlow = 0, cashTotal = 0 }) {
  // v28+ All Debts table - excel-style sort by rate / balance / payoff date
  const [allDebtsSort, setAllDebtsSort] = useState('rate');
  // r18 — editable snowball slider max. Default $5000; user can expand to
  // explore what-if scenarios (extra income, war chest, forecasted boost) per
  // founder feedback: "$5000 isn't the only amount; let them brainstorm with a
  // larger pot, but always able to snap back to reality."
  const baselineExtra = Math.max(0, Math.round(Math.max(0, netCashFlow) / 50) * 50);
  const [snowballMax, setSnowballMax] = useState(() => Math.max(5000, baselineExtra * 2));
  const [editingMax, setEditingMax] = useState(false);
  const [maxInput, setMaxInput] = useState(String(snowballMax));
  const applyMaxInput = () => {
    const parsed = parseInt(maxInput, 10);
    if (!isFinite(parsed) || parsed < 500) { setMaxInput(String(snowballMax)); setEditingMax(false); return; }
    const clamped = Math.min(parsed, 1000000);
    setSnowballMax(clamped);
    if (debtSnowballExtra > clamped) setDebtSnowballExtra(clamped);
    setEditingMax(false);
  };
  const snapToBaseline = () => {
    // Auto-fit the max so the baseline lands near the middle of the slider.
    const newMax = Math.max(5000, Math.ceil((baselineExtra * 2) / 1000) * 1000);
    setSnowballMax(newMax);
    setMaxInput(String(newMax));
    setDebtSnowballExtra(baselineExtra);
  };
  const exploreScenario = (multiplier, label) => {
    // What-if mode. Set the slider to baseline × multiplier; bump the max if
    // needed so the slider still has headroom on either side.
    const target = Math.round((baselineExtra * multiplier) / 50) * 50;
    const newMax = Math.max(snowballMax, Math.ceil((target * 1.5) / 1000) * 1000);
    setSnowballMax(newMax);
    setMaxInput(String(newMax));
    setDebtSnowballExtra(target);
  };
  const sorted = useMemo(() => {
    const arr = [...debts];
    arr.sort((a, b) => {
      if (a.leaveAlone !== b.leaveAlone) return a.leaveAlone ? 1 : -1;
      if (allDebtsSort === 'balance') return b.balance - a.balance;
      if (allDebtsSort === 'payoff') {
        const aClear = debtSnowball.activeDebts.find(p => p.id === a.id)?.clearedAtMonth ?? 999;
        const bClear = debtSnowball.activeDebts.find(p => p.id === b.id)?.clearedAtMonth ?? 999;
        return aClear - bClear;
      }
      // default: rate (highest first)
      return b.rate - a.rate;
    });
    return arr;
  }, [debts, allDebtsSort, debtSnowball.activeDebts]);
  const ent = (id) => entities.find(e => e.id === id);
  const debtsWithCleared = debts.filter(d => !d.leaveAlone).map(d => { const cleared = debtSnowball.activeDebts.find(p => p.id === d.id); return { ...d, clearedAtMonth: cleared?.clearedAtMonth, interestPaid: cleared?.interestPaid || 0 }; });
  const orderedByPayoff = debtsWithCleared.filter(d => d.clearedAtMonth).sort((a, b) => a.clearedAtMonth - b.clearedAtMonth);
  const totalDebt = debts.filter(d => !d.leaveAlone).reduce((s, d) => s + d.balance, 0);
  const totalMinPayment = debts.filter(d => !d.leaveAlone).reduce((s, d) => s + d.minPayment, 0);
  const interestSaved = debtMinOnly.totalInterest - debtSnowball.totalInterest;
  const stuckCount = debtMinOnly.stuckDebts.length;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Debt Snowball Engine</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Same pattern. Smaller numbers. Faster wins.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          The same snowball that pays off 11 rental properties also clears consumer debt — and the math here is even more motivating because the interest rates are much higher. Watch what gets freed up at each payoff.
        </p>
      </section>

      {/* All Debts table — excel-style sort by rate / balance / payoff date */}
      <section>
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3 pb-2 border-b border-[#1A1815]">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Debts · sorted by {allDebtsSort === 'rate' ? 'rate' : allDebtsSort === 'balance' ? 'balance' : 'payoff date'}</h2>
          <div className="flex gap-1">
            {[['rate','Rate'],['balance','Balance'],['payoff','Payoff date']].map(([id, label]) => (
              <button key={id} onClick={() => setAllDebtsSort(id)} className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${allDebtsSort === id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#1A1815] overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1A1815]"><th className="text-left p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Account</th><th className="text-left p-3 text-[10px] uppercase tracking-wider text-[#5A5751] hidden sm:table-cell">Entity</th><th className="text-right p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Rate</th><th className="text-right p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Min</th><th className="text-right p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Balance</th><th className="text-right p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Payoff</th></tr></thead>
            <tbody>
              {sorted.map((d) => {
                const cleared = debtSnowball.activeDebts.find(p => p.id === d.id);
                const payoff = cleared?.clearedAtMonth ? monthLabel(currentDate, cleared.clearedAtMonth) : (d.leaveAlone ? '—' : '?');
                return (
                  <tr key={d.id} className={`border-b border-[#E8E4DC] ${d.flag ? 'bg-[#FAF8F4]' : ''} ${d.leaveAlone ? 'opacity-60' : ''}`}>
                    <td className="p-3"><span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{d.name}</span>{d.flag && <span className="text-[10px] uppercase tracking-wider text-[#B85838] font-medium ml-2">⚠ {d.flag}</span>}{d.leaveAlone && <span className="text-[10px] uppercase tracking-wider text-[#5A5751] ml-2">Leave alone</span>}</td>
                    <td className="p-3 text-xs text-[#5A5751] hidden sm:table-cell">{ent(d.entityId)?.name.split('(')[0].trim() || '—'}</td>
                    <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{d.rate === 0 ? '0%' : `${d.rate.toFixed(2).replace(/\.00$/, '')}%`}</td>
                    <td className="p-3 text-right text-xs" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(d.minPayment)}</td>
                    <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(d.balance)}</td>
                    <td className="p-3 text-right text-xs" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{payoff}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top metrics */}
      <section>
        <SectionTitle>Where We Are Today</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
          <MetricCell label="Total debt" value={fmtCompact(totalDebt)} sub={`${debts.filter(d => !d.leaveAlone).length} accounts`} small accent="rust" />
          <MetricCell label="Min payments" value={fmt(totalMinPayment)} sub="/mo" small />
          <MetricCell label="Debt-free" value={debtSnowball.allClearedDate} sub={`${debtSnowball.allClearedYears.toFixed(1)}yr`} small accent="green" />
          <MetricCell label="Interest paid" value={fmt(debtSnowball.totalInterest)} sub="over journey" small accent="rust" />
        </div>
      </section>

      {/* The motivator — interest saved */}
      <section className="bg-white border-2 border-[#5A6E3D] p-4 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-medium mb-3">Interest Savings vs. Paying Minimums Only</div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
          <div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A5751]">Minimums only</div>
            <div className="text-lg sm:text-2xl text-[#B85838]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(debtMinOnly.totalInterest)}</div>
            <div className="text-[9px] sm:text-[10px] text-[#5A5751]">interest paid{stuckCount > 0 ? ` (${stuckCount} stuck)` : ''}</div>
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A5751]">With {fmt(debtSnowballExtra)}/mo</div>
            <div className="text-lg sm:text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(debtSnowball.totalInterest)}</div>
            <div className="text-[9px] sm:text-[10px] text-[#5A5751]">interest paid</div>
          </div>
          <div>
            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold">YOU SAVE</div>
            <div className="text-xl sm:text-3xl text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmt(interestSaved)}</div>
            <div className="text-[9px] sm:text-[10px] text-[#5A5751]">never paid</div>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          {stuckCount > 0 ? `Note: ${stuckCount} debt(s) at minimum payment don't even cover their interest — they'd grow indefinitely without the snowball.` : 'Every dollar you put toward snowballing is multiplied by the interest you avoid.'}
        </p>
      </section>

      {/* Strategy selector */}
      <section>
        <SectionTitle>Snowball Strategy</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-5 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Payoff order</div>
            <div className="grid grid-cols-3 gap-1">
              {[['snowball','Snowball','Smallest first'],['avalanche','Avalanche','Highest rate'],['hybrid','Hybrid','Quick wins, then rate']].map(([id, label, sub]) => (
                <button key={id} onClick={() => setDebtSnowballSort(id)} className={`px-2 py-2 text-left border ${debtSnowballSort === id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                  <div className="text-xs" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{label}</div>
                  <div className="text-[9px] uppercase tracking-wider opacity-75">{sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Monthly snowball (extra above minimums)</div>
                <div className="text-[10px] text-[#5A5751] mt-0.5">Total debt: <strong>{fmtCompact(totalDebt)}</strong> across {debts.filter(d => !d.leaveAlone).length} accounts · Min payments: <strong>{fmt(totalMinPayment)}/mo</strong></div>
              </div>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(debtSnowballExtra)}</div>
            </div>
            <input type="range" min="0" max={snowballMax} step="50" value={Math.min(debtSnowballExtra, snowballMax)} onChange={(e) => setDebtSnowballExtra(parseInt(e.target.value))} className="w-full accent-[#B85838]" aria-label={`Monthly snowball extra, 0 to ${fmt(snowballMax)}`} />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#5A5751] mt-1">
              <span>$0</span><span>{fmt(Math.round(snowballMax / 2))}</span><span>{fmt(snowballMax)}</span>
            </div>
            {/* r18 — Reality controls. Snap to what's actually possible at
                current net cash flow ("Baseline"), or stretch into what-if
                scenarios (1.5×, 2×, 3×) so the user can brainstorm with a
                bigger pot from new income or a forecasted war chest. */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <button
                type="button"
                onClick={snapToBaseline}
                title={`Set to ${fmt(baselineExtra)}/mo — what your current net cash flow supports`}
                className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                ↺ Baseline · {fmt(baselineExtra)}
              </button>
              <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">Explore:</span>
              <button type="button" onClick={() => exploreScenario(1.5, '1.5×')} className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">+50% income</button>
              <button type="button" onClick={() => exploreScenario(2, '2×')} className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">2× pot</button>
              <button type="button" onClick={() => exploreScenario(3, '3×')} className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">War chest 3×</button>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">Slider max:</span>
                {editingMax ? (
                  <>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      value={maxInput}
                      onChange={(e) => setMaxInput(e.target.value)}
                      onBlur={applyMaxInput}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyMaxInput(); if (e.key === 'Escape') { setMaxInput(String(snowballMax)); setEditingMax(false); } }}
                      autoFocus
                      className="w-24 text-xs px-2 py-1 border border-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      aria-label="Slider maximum (in dollars)"
                    />
                    <button type="button" onClick={applyMaxInput} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold hover:text-[#1A1815]">✓ Apply</button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMaxInput(String(snowballMax)); setEditingMax(true); }}
                    title="Type any dollar amount as the slider max — explore scenarios beyond default"
                    className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {fmt(snowballMax)} ✎
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              <strong>Reality check:</strong> at current net cash flow of <strong>{fmt(netCashFlow)}/mo</strong>, you can sustainably commit up to <strong>{fmt(baselineExtra)}/mo</strong>. Cash on hand right now: <strong>{fmt(cashTotal)}</strong>. The Explore buttons show what's possible if you grow income or unlock a war chest.
            </div>
            <details className="mt-2">
              <summary className="text-[10px] uppercase tracking-wider text-[#B85838] cursor-pointer hover:text-[#1A1815]">▸ Show top debts that add up to total</summary>
              <div className="mt-2 space-y-1 text-xs">
                {[...debts].filter(d => !d.leaveAlone).sort((a, b) => b.balance - a.balance).slice(0, 8).map(d => (
                  <div key={d.id} className="flex justify-between border-b border-[#E8E4DC] pb-1">
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{d.name} <span className="text-[#5A5751]">· {d.rate}%</span></span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(d.balance)}</span>
                  </div>
                ))}
                {debts.filter(d => !d.leaveAlone).length > 8 && <div className="text-[10px] text-[#5A5751] italic pt-1">+ {debts.filter(d => !d.leaveAlone).length - 8} more accounts shown in the full table below</div>}
              </div>
            </details>
          </div>
          <div className="grid grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="All paid in" value={yearsAndMonths(debtSnowball.allClearedMonth)} sub={debtSnowball.allClearedDate} small />
            <MetricCell label="Interest paid" value={fmt(debtSnowball.totalInterest)} small accent="rust" />
            <MetricCell label="Final freed" value={fmt(debtSnowball.finalFreedCashFlow)} sub="/mo" small accent="green" />
          </div>
          <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            When the last debt clears, <strong>{fmt(debtSnowball.finalFreedCashFlow)}/mo</strong> of freed cash flow becomes available — pivots straight to the rental snowball or family wealth building. The seven-year pattern again.
          </p>
        </div>
      </section>

      {/* Payoff cascade */}
      <section>
        <SectionTitle>Payoff Cascade · What Frees Up When</SectionTitle>
        <div className="bg-white border border-[#1A1815]">
          {orderedByPayoff.map((d, i) => {
            const freedSoFar = orderedByPayoff.slice(0, i + 1).reduce((s, x) => s + x.minPayment, 0);
            return (
              <div key={d.id} className={`p-4 ${i < orderedByPayoff.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="text-[#B85838] shrink-0 w-8 text-center" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div>
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{d.name}</span>
                        {d.flag && <span className="text-[10px] uppercase tracking-wider text-[#B85838] font-medium ml-2">⚠ {d.flag}</span>}
                      </div>
                      <div className="text-sm text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{monthLabel(currentDate, d.clearedAtMonth)}</div>
                    </div>
                    <div className="text-xs text-[#5A5751] mt-1">
                      Cleared in {yearsAndMonths(d.clearedAtMonth)} · {fmt(d.balance)} balance · {d.rate}% rate · Frees {fmt(d.minPayment)}/mo
                    </div>
                    <div className="text-xs text-[#5A6E3D] mt-1">
                      Snowball after this clears: <strong>{fmt(debtSnowballExtra + freedSoFar)}/mo</strong> attacking the next debt
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MOVED-FROM-BOTTOM: lighter dead anchor for the future. The visible section is at the top now. */}
      <section style={{ display: 'none' }} aria-hidden>
        <div className="bg-white border border-[#1A1815] overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1A1815]"><th className="text-left p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Account</th><th className="text-left p-3 text-[10px] uppercase tracking-wider text-[#5A5751] hidden sm:table-cell">Entity</th><th className="text-right p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Rate</th><th className="text-right p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Min</th><th className="text-right p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Balance</th></tr></thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id} className={`border-b border-[#E8E4DC] ${d.flag ? 'bg-[#FAF8F4]' : ''} ${d.leaveAlone ? 'opacity-60' : ''}`}>
                  <td className="p-3"><span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{d.name}</span>{d.flag && <span className="text-[10px] uppercase tracking-wider text-[#B85838] font-medium ml-2">⚠ {d.flag}</span>}{d.leaveAlone && <span className="text-[10px] uppercase tracking-wider text-[#5A5751] ml-2">Leave alone</span>}</td>
                  <td className="p-3 text-xs text-[#5A5751] hidden sm:table-cell">{ent(d.entityId)?.name.split('(')[0].trim() || '—'}</td>
                  <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{d.rate === 0 ? '0%' : `${d.rate.toFixed(2).replace(/\.00$/, '')}%`}</td>
                  <td className="p-3 text-right text-xs" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(d.minPayment)}</td>
                  <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(d.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// v28+ MVP v1.5 round 6 — DEV/OPS · Skills → Options engine
// Personal entrepreneurial-options matcher. PoeTech services portfolio is
// demoted below the matcher (still useful, no longer the lead).
// =============================================================================
function Opportunities({ opportunities, totals, skillProfiles = [], addSkillProfile, updateSkillProfile, deleteSkillProfile, userTier, addProject, addScope, addCapexItem, setView, projects = [] }) {
  const grouped = opportunities.reduce((acc, o) => { (acc[o.person] = acc[o.person] || []).push(o); return acc; }, {});

  // Tier-gated count of opportunities shown per profile.
  const optionsPerProfile = (() => {
    if (tierMeets(userTier, 'family')) return 6;       // full library access
    if (tierMeets(userTier, 'poetech-plus')) return 3;
    return 1;                                            // Foundation tease
  })();
  const canWrap = tierMeets(userTier, 'premium');

  // Skill profile editor
  const blankProfile = () => ({ name: '', skills: '', hoursPerWeek: 0, monthlyIncome: 0, location: '', techComfort: 3, notes: '' });
  const [profileForm, setProfileForm] = useState(blankProfile());
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const startAddProfile = () => { setProfileForm(blankProfile()); setEditingProfileId(null); setShowProfileForm(true); };
  const startEditProfile = (p) => { setProfileForm({ ...p }); setEditingProfileId(p.id); setShowProfileForm(true); };
  const cancelProfile = () => { setShowProfileForm(false); setEditingProfileId(null); };
  const submitProfile = () => {
    if (!profileForm.name) { alert('Profile name is required.'); return; }
    if (editingProfileId) updateSkillProfile && updateSkillProfile(editingProfileId, profileForm);
    else addSkillProfile && addSkillProfile(profileForm);
    cancelProfile();
  };
  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';

  // Wrap-me-with-the-tech handler — auto-create Project + Scope from an opportunity.
  // Round 11: capacity check first. If adding this project would push the family
  // over their available hours/week, prompt to park as TBD instead of stacking
  // another commitment they can't actually do.
  const wrapWithTech = (op, profile) => {
    if (!canWrap) { alert(`The "Wrap me with the tech" handoff unlocks at ${TIER_LABEL['premium']}. See pricing tiers in About.`); return; }
    const decision = capacityDecisionForNewProject(projects, skillProfiles, op.hoursPerWeek, {
      label: `"${op.title}" (${op.hoursPerWeek} hrs/wk)`,
    });
    if (decision.decision === 'cancel') return;
    const projectStatus = decision.decision === 'add-tbd' ? 'tbd' : 'planning';
    const today = new Date(); const isoToday = today.toISOString().slice(0, 10);
    const endIso = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const projectTitle = `${profile.name} · ${op.title}${projectStatus === 'tbd' ? ' (TBD)' : ''}`;
    addProject && addProject({
      title: projectTitle,
      startDate: isoToday,
      endDate: endIso,
      status: projectStatus,
      domain: 'business-poetech',
      description: `Auto-created from Dev/Ops opportunity matcher.${projectStatus === 'tbd' ? '\n\n⚐ TBD · parked because the family is already at or near capacity. Promote to Active from Projects tab when bandwidth opens up.' : ''}\n\nOpportunity: ${op.title} (${op.category})\nSkill tags: ${op.skillTags.join(', ')}\nTypical earnings: $${op.earningsLow}–$${op.earningsHigh}/mo · ${op.hoursPerWeek} hrs/wk\nStartup cost: $${op.startupCost} · time to first dollar: ${op.timeToFirstDollar}\n\nExample to model: ${op.example}\n\nPoeTech wraps you with: ${op.techStack}`,
      hoursPerWeek: op.hoursPerWeek,
      entityId: 'e-personal',
      contractorIds: [],
      conversationLog: [],
    });
    addScope && addScope({
      templateType: 'service',
      templateName: 'Service Engagement',
      title: `Build kit · ${op.title}`,
      entityId: 'e-personal',
      projectId: '', // user can link to the new project after the auto-created project gets its id
      contractorName: '', contractorEmail: '', contractorPhone: '',
      scopeOfWork: `Build the tech stack to wrap ${profile.name} into the "${op.title}" path.\n\nWhat PoeTech delivers: ${op.techStack}`,
      deliverables: '',
      materials: '',
      schedule: `Discovery within 1 week. Build target: ${endIso}.`,
      paymentTerms: '',
      acceptanceCriteria: '',
      requirements: '',
      warranty: '',
    });
    if (op.startupCost > 0 && addCapexItem) {
      addCapexItem({
        category: 'Tools', name: `Startup kit · ${op.title}`, description: `Initial equipment / setup for ${op.title}`,
        link: '', priority: 2, cost: op.startupCost, neededBy: 'Soon', status: 'planned', notes: `Linked to Dev/Ops opportunity. Typical first-dollar timing: ${op.timeToFirstDollar}.`,
        entityId: 'e-personal', module: '', projectId: '',
        purchaseTargetDate: endIso, locationId: '', purchasedFromAccountId: '',
        make: '', model: '', serial: '',
      });
    }
    alert(`Created a project "${projectTitle}" + a draft scope. Open the Projects tab to refine details.`);
    if (setView) setView('projects');
  };

  return (
    <div className="space-y-10">
      {/* HERO — orient the user */}
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-medium">Dev/Ops · Your Entrepreneurial Options</div>
        <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Your skills · what's working for people like you · how PoeTech wraps it.</h2>
        <p className="text-sm leading-relaxed mt-2 text-[#5A5751] max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Add the skills, hours, and situation of each person in your household. We match them against curated entrepreneurial paths that real people run today, with what PoeTech can build to wrap that path in tech. <strong>You're seeing {optionsPerProfile} option{optionsPerProfile === 1 ? '' : 's'} per person at your tier.</strong>
        </p>
      </section>

      {/* SKILL PROFILES — editor */}
      <section aria-labelledby="profiles-h">
        <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h3 id="profiles-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">My Skills &amp; Situation · {skillProfiles.length} {skillProfiles.length === 1 ? 'profile' : 'profiles'}</h3>
          <button type="button" onClick={() => showProfileForm ? cancelProfile() : startAddProfile()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showProfileForm ? '× Cancel' : '+ Add a profile'}</button>
        </div>
        {showProfileForm && (
          <div className="bg-white border border-[#B85838] p-3 mb-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">{editingProfileId ? 'Edit profile' : 'New profile'}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div><label htmlFor="sp-name" className={labelCls}>Name</label><input id="sp-name" className={fieldCls} value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
              <div><label htmlFor="sp-loc" className={labelCls}>Location (city, state)</label><input id="sp-loc" className={fieldCls} value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} /></div>
              <div><label htmlFor="sp-tech" className={labelCls}>Tech comfort (1–5)</label><input id="sp-tech" type="number" min="1" max="5" className={fieldCls} value={profileForm.techComfort} onChange={e => setProfileForm({ ...profileForm, techComfort: parseInt(e.target.value) || 3 })} /></div>
            </div>
            <div><label htmlFor="sp-skills" className={labelCls}>Skills (comma-separated tags)</label><textarea id="sp-skills" rows="2" className={fieldCls} placeholder="e.g., carpentry, plumbing, spanish, sales, teaching" value={profileForm.skills} onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })} /></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div><label htmlFor="sp-hours" className={labelCls}>Hours/week available</label><input id="sp-hours" type="number" min="0" max="80" className={fieldCls} value={profileForm.hoursPerWeek} onChange={e => setProfileForm({ ...profileForm, hoursPerWeek: parseInt(e.target.value) || 0 })} /></div>
              <div><label htmlFor="sp-income" className={labelCls}>Current monthly income</label><input id="sp-income" type="number" min="0" className={fieldCls} value={profileForm.monthlyIncome} onChange={e => setProfileForm({ ...profileForm, monthlyIncome: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><label htmlFor="sp-notes" className={labelCls}>Notes</label><input id="sp-notes" className={fieldCls} value={profileForm.notes} onChange={e => setProfileForm({ ...profileForm, notes: e.target.value })} /></div>
            <button type="button" onClick={submitProfile} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingProfileId ? 'Save Changes' : 'Save Profile'}</button>
          </div>
        )}
        {skillProfiles.length === 0 ? (
          <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No profiles yet — add one above to see personalized options.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {skillProfiles.map(p => (
              <div key={p.id} className="bg-white border border-[#E8E4DC] p-3">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{p.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{p.hoursPerWeek}h/wk · {fmt(p.monthlyIncome)}/mo · tech {p.techComfort}/5{p.location ? ` · ${p.location}` : ''}</div>
                    {p.skills && <div className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{p.skills}</div>}
                    {p.notes && <div className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{p.notes}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button type="button" onClick={() => startEditProfile(p)} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Edit</button>
                  <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] ml-auto" />
                  <button type="button" onClick={() => { if (confirm(`Delete profile "${p.name}"? Personalized options for them will disappear.`)) deleteSkillProfile && deleteSkillProfile(p.id); }} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PERSONALIZED OPTIONS PER PROFILE */}
      <section aria-labelledby="options-h">
        <h3 id="options-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Personalized Options · top {optionsPerProfile} per profile</h3>
        {skillProfiles.length === 0 && <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Add a profile above to unlock matched options.</p>}
        <div className="space-y-6">
          {skillProfiles.map(profile => {
            const matches = matchOpportunities(profile, OPPORTUNITY_LIBRARY).slice(0, optionsPerProfile);
            return (
              <div key={profile.id}>
                <h4 className="text-sm mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{profile.name}</h4>
                {matches.length === 0 ? (
                  <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No matches yet. Add more skill tags to {profile.name}'s profile (e.g., "teaching, music, real estate").</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {matches.map(op => (
                      <article key={op.id} className="bg-white border border-[#1A1815] p-4">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold">{op.category}</div>
                            <h5 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{op.title}</h5>
                          </div>
                          <div className="text-right">
                            <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(op.earningsLow)}–{fmt(op.earningsHigh)}<span className="text-xs text-[#5A5751]">/mo</span></div>
                            <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{op.hoursPerWeek}h/wk · startup {fmt(op.startupCost)}</div>
                          </div>
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-2">first dollar: {op.timeToFirstDollar}</div>
                        <p className="text-sm text-[#5A5751] leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}><strong>Example:</strong> {op.example}</p>
                        <p className="text-xs leading-snug bg-[#FAF8F4] border border-[#E8E4DC] p-2" style={{ fontFamily: '"Fraunces", serif' }}>🛠 {op.techStack}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <button type="button" onClick={() => wrapWithTech(op, profile)} disabled={!canWrap} className={`text-xs uppercase tracking-wider px-3 py-2 font-semibold focus:outline focus:outline-2 focus:outline-[#B85838] ${canWrap ? 'bg-[#1A1815] text-white hover:bg-[#B85838]' : 'bg-[#E8E4DC] text-[#5A5751] cursor-not-allowed'}`} title={canWrap ? 'Auto-create a project + scope + capex item' : `Unlocks at ${TIER_LABEL['premium']}`}>
                            {canWrap ? '🛠 Wrap me with the tech →' : `🔒 Wrap me (unlocks at ${TIER_LABEL['premium']})`}
                          </button>
                          <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">matched on: {op.skillTags.slice(0, 3).join(' · ')}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-[#5A5751] italic mt-4 max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Examples are composites drawn from public reporting and industry surveys, not specific individuals. Earnings ranges reflect typical solo / small-team operators in the US; your mileage will vary by region, hours, and time invested.
        </p>
      </section>

      {/* MY ACTIVE PIPELINE — kept from prior version */}
      <section aria-labelledby="pipeline-h">
        <SectionTitle eyebrow="Pipeline">My Active Pipeline · Near-term opportunities</SectionTitle>
        <p id="pipeline-h" className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          What's actively in motion this year. Each row compounds into the household projection. Active conversations get priority.
        </p>
        {Object.entries(grouped).map(([person, items]) => (
          <section key={person} className="mb-4">
            <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">{person}</h3>
            <div className="bg-white border border-[#1A1815]">
              {items.map((o, i) => (
                <div key={o.id} className={`p-4 ${i < items.length - 1 ? 'border-b border-[#E8E4DC]' : ''} ${o.flag ? 'bg-[#FAF8F4]' : ''}`}>
                  <div className="flex justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{o.what}</span>
                        {o.flag && <span className="text-[10px] uppercase tracking-wider text-[#B85838] font-medium">⚠ Priority</span>}
                      </div>
                      <div className="text-xs text-[#5A5751]">{o.skill} · {o.status}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(o.monthly)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">/ mo</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </section>

      {/* DEMOTED — was the lead, now the answer to "I picked one, who builds it?" */}
      <section className="bg-[#FAF8F4] border border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Picked one? Here's how PoeTech wraps it.</div>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          The four engagement models below are how PoeTech actually builds the technology around an option you pick — from a Saturday hobbyist setup up through full enterprise transformation.
        </p>
      </section>
      <PoeTechServicesPortfolio />
      <PoeTechProjections />
      <LowHangingFruit />
      <PoeTechDifferentiation />
    </div>
  );
}

// =============================================================================
// POETECH DIFFERENTIATION — v26 · Why $249 holds against larger competitors
// Honest moat analysis — structural advantages, not marketing claims
// =============================================================================
function PoeTechDifferentiation() {
  const moats = [
    {
      kind: 'Structural',
      title: 'Faith-integrated framework',
      detail: 'Cannot be replicated by VC-backed competitors. Worldview is woven through every module — Original Business Systems, debt-freedom theology, Sabbath rest. A bigger competitor would have to fundamentally re-architect to copy this, and would alienate their existing market doing so.',
      strength: 'Strong'
    },
    {
      kind: 'Structural',
      title: 'Local-first architecture',
      detail: 'Data stays on the user\'s device. No cloud lock-in, no surveillance capitalism, no compliance debt at the platform level. Reverses the SaaS norm. Larger SaaS companies are architecturally cloud-first — they can\'t pivot without losing their margin model.',
      strength: 'Strong'
    },
    {
      kind: 'Structural',
      title: 'Sponsored Community tier',
      detail: '100% of sponsorship revenue funds free Community tier for families in need. Cannot be done by VC-backed companies who must return capital. Inverts the typical SaaS incentive — generosity is the business model, not a side feature.',
      strength: 'Strong'
    },
    {
      kind: 'Authenticity',
      title: 'Vertical integration with real businesses',
      detail: 'Poe Properties (11 rentals · real management), TLC Therapy Solutions (real clinical practice · 7 clinicians), Church of the Living God (real ministry · Tech Director). Every workflow tested on actual family businesses before shipped. Competitors would need to start parallel businesses to match this provenance.',
      strength: 'Strong'
    },
    {
      kind: 'Authenticity',
      title: 'Family-owned · No external capital',
      detail: 'No board pressure to extract value, no exit timeline. Long-term horizon (5-10 years to scale). Patient builders, not stock-option engineers. Customers feel this in every product decision — no growth hacks, no dark patterns, no urgency manipulation.',
      strength: 'Medium-Strong'
    },
    {
      kind: 'Market',
      title: 'Underserved-markets focus',
      detail: '10 specific populations: adult children caring for aging parents · kinship caregivers · foster families · reentry/formerly incarcerated · single-parent small business owners · small Black-owned contractors · independent farmers · small churches · IEP families · direct-care workers. Broad SaaS won\'t target these. Few competitors can credibly serve them.',
      strength: 'Medium-Strong'
    },
    {
      kind: 'Economic',
      title: 'Replaces $400-1000/mo of SaaS stack',
      detail: 'Business tier ($249) replaces: QuickBooks ($30-90) + CRM ($30-50) + project management ($20-30) + practice management ($75-150) + property tracking ($50-100) + scheduling ($14-29) + accounting consult ($50-200) + spreadsheet sprawl ($0 but real cost). Real math, real value, easy to explain.',
      strength: 'Medium-Strong'
    },
    {
      kind: 'Bundled',
      title: 'Unified across life and work',
      detail: 'Financial + Practice + Projects + Spiritual + Community in one tool. Most competitors do ONE domain well (Stessa for rentals, QuickBooks for books, Practice Better for clinics). PoeTech is the only platform organized around a family rather than a function.',
      strength: 'Medium'
    },
  ];

  const competitiveLandscape = [
    { competitor: 'YNAB', segment: 'Personal budget', overlap: 'Financial only · no faith · no business · no community · cloud-only', price: '$14.99/mo' },
    { competitor: 'QuickBooks', segment: 'Small business accounting', overlap: 'Books only · enterprise-feel · no family integration', price: '$30-90/mo' },
    { competitor: 'Stessa', segment: 'Rental properties', overlap: 'Rentals only · no consumer debt · no practice · no spiritual', price: '$0-30/mo' },
    { competitor: 'Notion / Airtable', segment: 'General-purpose', overlap: 'Build-your-own · no opinionated framework · no faith · no community', price: '$10-40/mo' },
    { competitor: 'Practice Better / SimplePractice', segment: 'Clinical practice', overlap: 'Practice ops only · no family financial · HIPAA-heavy', price: '$50-150/mo' },
    { competitor: 'Faith-integrated SaaS', segment: '(direct competitor)', overlap: 'None identified at the family-OS layer', price: 'N/A' },
  ];

  return (
    <section>
      <SectionTitle eyebrow="Differentiation">Why $249 Holds · The Moats</SectionTitle>
      <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        The honest answer to "why wouldn't a bigger competitor undercut us?" — they can't, structurally. The moats below are not marketing claims; they're architectural and economic facts that competitors would have to fundamentally rebuild to match. Some take years and capital changes that VC-backed companies can't make.
      </p>

      <div className="space-y-2 mb-6">
        {moats.map((m, i) => (
          <div key={i} className="bg-white border border-[#E8E4DC] p-4 hover:border-[#1A1815] transition-colors">
            <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">{m.kind}</span>
                <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{m.title}</h4>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${m.strength === 'Strong' ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`}>{m.strength}</span>
            </div>
            <p className="text-sm text-[#5A5751] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{m.detail}</p>
          </div>
        ))}
      </div>

      <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-3 pb-2 border-b border-[#1A1815]">Competitive Landscape</h3>
      <div className="bg-white border border-[#1A1815]">
        <div className="grid grid-cols-12 gap-2 p-3 border-b-2 border-[#1A1815] text-[10px] uppercase tracking-wider text-[#5A5751] bg-[#FAF8F4]">
          <div className="col-span-3">Competitor</div>
          <div className="col-span-3">Segment</div>
          <div className="col-span-4">What overlaps · what doesn't</div>
          <div className="col-span-2 text-right">Pricing</div>
        </div>
        {competitiveLandscape.map((c, i) => (
          <div key={i} className={`grid grid-cols-12 gap-2 p-3 text-xs ${i < competitiveLandscape.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`} style={{ fontFamily: '"Fraunces", serif' }}>
            <div className="col-span-3" style={{ fontWeight: 600 }}>{c.competitor}</div>
            <div className="col-span-3 text-[#5A5751]">{c.segment}</div>
            <div className="col-span-4 text-[#5A5751]">{c.overlap}</div>
            <div className="col-span-2 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{c.price}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
        <strong>Bottom line:</strong> there is no direct competitor at the family-OS layer with faith integration. The closest peers each do ONE domain well — none integrate financial + clinical + rental + project + community + spiritual into a single sovereign tool for a family-led household and business. We are genuinely first to this combination, and structural moats make it expensive for any competitor to follow.
      </p>
    </section>
  );
}

// =============================================================================
// LOW-HANGING FRUIT — v26 · Revenue opportunities not yet on the radar
// Real, near-term income with low effort + existing assets
// =============================================================================
function LowHangingFruit() {
  const opportunities = [
    {
      name: 'TLC Group Therapy Cohorts',
      effort: 'Low',
      revenue: '$10-18K/yr',
      window: 'Quarter 1',
      who: 'Christina',
      detail: 'Group therapy is already listed on TLC site. Run 4-6 cohorts/year, 6-8 weeks each, 6-8 participants. At $200-400 total per participant, each cohort = $2-3K. Higher margin than 1:1. Real clinical impact at scale.',
    },
    {
      name: 'COLG Faith + Finance Workshop',
      effort: 'Low',
      revenue: '$5-15K/yr',
      window: 'Quarter 1-2',
      who: 'Darrell',
      detail: 'You already teach at COLG. Quarterly workshop series on faith-integrated stewardship. Love offering $25-50 × 20-50 attendees × 4 events/yr. Also drives Loved Ones tier sign-ups and warm market for PoeTech.',
    },
    {
      name: 'Affiliate revenue from tools we recommend',
      effort: 'Very low',
      revenue: '$100-500/mo passive',
      window: 'Immediate',
      who: 'Setup once',
      detail: 'Acuity, Stripe, Cloudflare, KDP, hosting providers — all have affiliate programs. We recommend them anyway. Sign up, get unique links, use in product + briefs. $0 work after setup. Recurring passively.',
    },
    {
      name: 'PoeTech Stewardship Newsletter',
      effort: 'Medium (weekly)',
      revenue: '$500-2K/mo within 6mo',
      window: 'Quarter 2',
      who: 'Darrell',
      detail: 'Repurpose strategic briefs into weekly Substack/Beehiiv content. Faith + finance + family-led business. Build free audience first. Add paid tier ($5-10/mo) when 1K+ subscribers. Drives platform discovery.',
    },
    {
      name: 'Pre-Marital Bundle (Christina + Darrell)',
      effort: 'Medium',
      revenue: '$1-3K/mo',
      window: 'Quarter 2',
      who: 'Both',
      detail: '6-session package: couples counseling (Christina) + financial planning (Darrell) + faith curriculum + planning workbook. $499-999 one-time. 2-3 couples/month from COLG referrals + TLC pipeline. Unique combined offering.',
    },
    {
      name: 'MSW Supervision Hours',
      effort: 'Low (within Christina\'s practice)',
      revenue: '$1-5K/mo',
      window: 'Quarter 1',
      who: 'Christina (or senior contractors)',
      detail: 'New LCSWs need 100+ supervision hours from senior clinicians. Christina supervises 2-4 supervisees at $75-150/hr × 4-8 hrs/wk. Adjacent revenue to existing clinical practice. Helps grow TLC team simultaneously.',
    },
    {
      name: 'Scope Template Downloads',
      effort: 'Very low (one-time productize)',
      revenue: '$200-2K/mo passive',
      window: 'Quarter 2',
      who: 'Setup once',
      detail: 'Productize the contractor scope templates as standalone PDF downloads. $19-49 each. Sold to non-subscribers who want the document without the app. Gumroad or PoeTech Bookstore. Drives subscription upgrades.',
    },
    {
      name: 'Small Landlord Tier ($99/mo)',
      effort: 'Low (already built)',
      revenue: 'Fills gap between $89-$149',
      window: 'Phase 5 (with billing)',
      who: 'Product',
      detail: 'Add a $99/mo "Small Landlord" tier between Family and Premium. For people with 1-5 rentals who need property tracking but not full business features. PoeTech\'s Rentals + Books + Projects modules without Practice. Captures landlords who find the Premium tier overshoots.',
    },
  ];

  const totalLow = opportunities.reduce((s, o) => {
    const match = o.revenue.match(/\$([\d.]+)-([\d.]+)K?/);
    if (!match) return s;
    const low = parseFloat(match[1]) * (o.revenue.includes('K') ? 1000 : 1);
    return s + (o.revenue.includes('/mo') ? low * 12 : low);
  }, 0);

  return (
    <section>
      <SectionTitle eyebrow="Low-Hanging Fruit">Revenue Not Yet On The Radar</SectionTitle>
      <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        Eight near-term revenue streams using existing assets — TLC clinical practice, COLG teaching access, scope templates, content. Most require setup once and produce recurring revenue. Conservative aggregate: <strong>~${(totalLow/1000).toFixed(0)}K-${(totalLow * 2 / 1000).toFixed(0)}K Year 1</strong> beyond the subscription business.
      </p>
      <div className="space-y-2">
        {opportunities.map((o, i) => (
          <div key={i} className="bg-white border border-[#E8E4DC] p-4 hover:border-[#5A6E3D] transition-colors">
            <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
              <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{o.name}</h4>
              <div className="text-base text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{o.revenue}</div>
            </div>
            <div className="flex items-baseline gap-3 mb-2 flex-wrap text-[10px] uppercase tracking-wider">
              <span className="text-[#5A5751]"><span className="text-[#B85838] font-semibold">Effort:</span> {o.effort}</span>
              <span className="text-[#5A5751]"><span className="text-[#B85838] font-semibold">Window:</span> {o.window}</span>
              <span className="text-[#5A5751]"><span className="text-[#B85838] font-semibold">Who:</span> {o.who}</span>
            </div>
            <p className="text-sm text-[#5A5751] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{o.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PoeTechServicesPortfolio() {
  const models = [
    {
      name: 'Hourly · Per Project',
      tagline: 'Pay for time. Walk away with a deliverable.',
      pricing: '$150–$300/hr · $5K–$25K typical project',
      best: 'For individuals or organizations with a specific build need and budget. Defined scope, fixed timeline, clean handoff.',
      includes: ['Situational analysis · technical feasibility','Build the thing (web, mobile, integrations)','Documentation for handoff','30 days of support after delivery'],
      forWho: 'Churches building event registration. Small businesses needing custom tools. Independent practitioners (like Christina) wanting workflow automation.',
      color: 'border-[#1A1815]',
    },
    {
      name: 'Retainer · Ongoing Access',
      tagline: 'A trained technologist team you can see and talk to. For a fee that\'s worth it.',
      pricing: '$2K–$5K/mo · 6-month minimum',
      best: 'For founders with an idea and some background who need a thinking partner. Strategic + tactical access. Hand-holding without hand-outs.',
      includes: ['Weekly strategy session','Continuous build progress','Direct access to Darrell + team','Tools & systems setup','Personal touch — relational, not transactional'],
      forWho: 'The warm prospects you mentioned — people with business + some tech background but not enough to build alone. They need someone to see and talk to.',
      color: 'border-[#B85838]',
    },
    {
      name: 'Revenue Share · 1099 Partnership',
      tagline: 'Equity-like stake in the resulting business. We build together. Split the profits.',
      pricing: '20%–49% ownership (negotiable based on lift)',
      best: 'For founders whose idea is strong but capital is short. We do situational analysis, build, and grow it together. Aligned incentives — PoeTech wins when you win.',
      includes: ['All Retainer features','Full situational analysis + market research','Full build · ongoing iteration','Strategic operations support','PoeTech holds 1099 ownership stake in resulting LLC','Profits split per agreed structure'],
      forWho: 'Founders who would otherwise have to dilute themselves into venture capital. The Yahweh-approves alternative: keep ownership in the community, not Sand Hill Road.',
      color: 'border-[#5A6E3D]',
    },
    {
      name: 'Enterprise · Transformation',
      tagline: 'For big businesses tired of $5M-per-year, 5-year BigCo engagements ($25M total). Pay us what the work is worth.',
      pricing: '$50K–$5M projects · $25K–$75K/mo retainers · $400–$800/hr senior rate',
      best: 'For mid-large companies who need major build, integration, or transformation work — where compressed delivery and senior depth matter more than headcount. Premium pricing reflects compressed time AND saving you from a relationship with money-pit consulting firms.',
      includes: ['Senior architect on every call · no junior delegation','Compressed delivery — 6 months where BigCo quotes 18+','Modern stack expertise (not legacy Java/SOAP shops)','Direct executive relationship · no account-management layer','Outcome-based scoping — fixed milestones, not endless billable hours','Knowledge transfer · your team owns it after handoff'],
      forWho: 'CTOs, CIOs, COOs facing the standard BigCo offer: $5M per year × 5 years = $25M, delivered slowly with a fraction of the promised value. Our model inverts that math. Pay us $3M for ~2 months of compressed senior work and walk away with $5M of delivered value — saving $22M AND four-and-a-half years on the same problem. Pricing scales from focused $50K interventions to full $5M transformations. Fair because it reflects time saved AND value delivered.',
      color: 'border-[#1A1815]',
    },
  ];

  return (
    <section>
      <SectionTitle eyebrow="PoeTech Services">Four Ways to Work Together</SectionTitle>
      <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        PoeTech-the-product (Family OS app) compounds over years. PoeTech-the-services pays the bills this month and the next, and seeds business systems for organizations and individuals who have ideas but need a trained team to bring them to life. <strong>You see us. You talk to us. The personal touch is the point.</strong>
      </p>

      {/* v27: Why Hire Us — direct positioning callout */}
      <div className="bg-white border-2 border-[#B85838] p-5 sm:p-6 mb-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">Why Hire Us · Not Them</div>
        <h3 className="text-2xl sm:text-3xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Faster and better than the big team because it's intimate.
        </h3>
        <p className="text-base leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          We only take on so many projects at a time. That focus is the point — not a limitation. We get done faster and have more impact because we're <strong>built to run lean</strong>, and it's reflected in the price.
        </p>
        <div className="bg-[#FAF8F4] border border-[#1A1815] p-4 my-4">
          <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
            <strong>Do you want to meet for 6 months to get what we can get done in 6 weeks?</strong>
          </p>
          <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Oh, and we have hands-on experience in the dev/ops <em>and</em> business worlds. Not just consultants. Not just engineers. <strong>Operators who ship.</strong>
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-[#FAF8F4] p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">Intimate</div>
            <p className="text-xs leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>You talk to the people doing the work. No account managers, no offshore handoffs, no game of telephone.</p>
          </div>
          <div className="bg-[#FAF8F4] p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">Lean</div>
            <p className="text-xs leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>No bloat. No process for process's sake. Lower price reflects lower overhead, not lower quality.</p>
          </div>
          <div className="bg-[#FAF8F4] p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">Both Sides</div>
            <p className="text-xs leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>Hands-on dev/ops AND business. We understand both your stack and your P&L. Rare combination.</p>
          </div>
        </div>
        <div className="border-t border-[#1A1815] pt-3">
          <p className="text-xl text-center" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.01em' }}>
            <span className="text-[#B85838]">Pay us to get done now.</span>
          </p>
        </div>
      </div>

      {/* v29: Pricing Philosophy — Dual Track */}
      <div className="bg-white border-2 border-[#5A6E3D] p-5 sm:p-6 mb-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold mb-2">Pricing Philosophy · Two Tracks</div>
        <h3 className="text-xl sm:text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Fair pricing both ways. Not slave wages. Not extortion.
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">Family · Small Business · Founders</div>
            <p className="text-sm mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Accessible by design. Foundation tier free forever. Loved Ones free PoeTech+ for life (first 100 COLG families). Subscriptions $39–$249/mo. Community tier free for families in need (sponsor-funded).
            </p>
            <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              No one is priced out of stewardship.
            </p>
          </div>
          <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#1A1815] font-semibold mb-1">Enterprise · Big Business with Budget</div>
            <p className="text-sm mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Premium pricing for compressed delivery. $50K–$5M projects. $25K–$75K/mo retainers. $400–$800/hr senior rates. Pay us $3M for ~2 months of senior, focused work and walk with $5M of delivered value — vs <strong>$5M per year × 5 years = $25M</strong> from a BigCo for less.
            </p>
            <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              We save you from a relationship with money pits.
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>The principle:</strong> low prices for those who genuinely need accessible tools. High-ticket pricing for those who have good money and would otherwise pay 10x more for less work over 5x more time. <strong>Our prices are fit for both of us to do well.</strong> Not extractive. Not exploitative. Aligned.
        </p>
      </div>

      <div className="space-y-3">
        {models.map((m, i) => (
          <div key={i} className={`bg-white border-2 ${m.color} p-5`}>
            <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
              <h3 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{m.name}</h3>
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#5A5751] font-medium">{m.pricing}</span>
            </div>
            <p className="text-sm italic text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>"{m.tagline}"</p>
            <p className="text-sm mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{m.best}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] mb-1 font-medium">Includes</div>
                <ul className="text-xs text-[#5A5751] space-y-1">
                  {m.includes.map((f, j) => <li key={j} className="flex gap-2"><span className="text-[#B85838]">·</span><span>{f}</span></li>)}
                </ul>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] mb-1 font-medium">For Who</div>
                <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{m.forWho}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Annual revenue scenarios */}
      <div className="bg-white border border-[#1A1815] p-5 mt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-2">Year-Ahead Visibility · PoeTech Services Revenue</div>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          What this looks like over 12 months as a portfolio mix:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-[#E8E4DC]">
            <span style={{ fontFamily: '"Fraunces", serif' }}>2 Retainer clients × $3K/mo × 12mo</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }} className="text-[#5A6E3D]">$72K</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#E8E4DC]">
            <span style={{ fontFamily: '"Fraunces", serif' }}>4 Project engagements × $15K average</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }} className="text-[#5A6E3D]">$60K</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#E8E4DC]">
            <span style={{ fontFamily: '"Fraunces", serif' }}>1 Revenue share engagement · profit split</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }} className="text-[#5A6E3D]">$0–$50K+ (varies)</span>
          </div>
          <div className="flex justify-between py-2 font-medium">
            <span style={{ fontFamily: '"Fraunces", serif' }}>Year 1 total potential</span>
            <span className="text-lg text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>$132K–$180K+</span>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
          This is the bridge from where the Poes are today to where PoeTech-the-product reaches scale. Services revenue covers operations and funds the build for the family OS without diluting ownership. Patient capital, compounded.
        </p>
      </div>

      {/* Collaboration call-out */}
      <div className="bg-white border-2 border-dashed border-[#B85838] p-5 mt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-2">⚡ Active Conversations</div>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Two warm prospects are already interested — each with business background and some tech experience, both looking for the personal touch PoeTech offers. Treat them as Project or Retainer engagements first; convert to Revenue Share when fit becomes obvious. See "Active This Year" below for the entries.
        </p>
      </div>
    </section>
  );
}

// =============================================================================
// POETECH BUSINESS PROJECTIONS — v10 NEW
// Shows what's invisible in current data: PoeTech revenue at customer scale
// =============================================================================
function PoeTechProjections() {
  // Tier distribution assumptions — refreshed v26 with current pricing
  const [foundationPct, setFoundationPct] = useState(55);
  const [plusPct, setPlusPct] = useState(22);
  const [familyPct, setFamilyPct] = useState(13);
  const [premiumPct, setPremiumPct] = useState(6);
  const [businessPct, setBusinessPct] = useState(2);
  // Remaining 2% = Loved Ones + Community (both free, sponsored)

  const tierPrices = { foundation: 0, plus: 39, family: 89, premium: 149, business: 249 };
  const arpuMonthly = (foundationPct * 0 + plusPct * tierPrices.plus + familyPct * tierPrices.family + premiumPct * tierPrices.premium + businessPct * tierPrices.business) / 100;
  const arpuAnnual = arpuMonthly * 12;
  const payingPct = plusPct + familyPct + premiumPct + businessPct;
  const totalPct = foundationPct + plusPct + familyPct + premiumPct + businessPct;

  // Customer milestones with realistic time-to-reach for bootstrapped SaaS
  const milestones = [
    { customers: 100,       year: 1,  context: 'Warm market · Loved Ones tier · Church + family network', poeFamily: 'Still paying down personal debt' },
    { customers: 1000,      year: 2,  context: 'Word of mouth from first 100 · early product-led growth', poeFamily: 'Consumer debt-free path clearly working' },
    { customers: 10000,     year: 4,  context: 'Crossed into mainstream awareness · Marketing module live', poeFamily: '~7 of 11 rentals paid off · Real income from PoeTech' },
    { customers: 100000,    year: 7,  context: 'Calendly was here at year 7 · PoeTech hardware DTC viable', poeFamily: 'All rentals owned free · Compounding from PoeTech equity' },
    { customers: 1000000,   year: 10, context: 'Major SaaS scale · Mission-level impact across families', poeFamily: 'Generational wealth · Full Sabbath rest possible' },
  ];

  return (
    <section>
      <SectionTitle eyebrow="PoeTech Business">Projections · The Invisible View</SectionTitle>
      <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        What's currently invisible: the revenue PoeTech generates as it reaches more families. Below: customer milestone projections with realistic time horizons, and what they unlock for the Poe family and every family using the platform. <strong>This is for all families who own their own data — multiple paths to succeed, multiple ways to be fruitful.</strong>
      </p>

      {/* Tier mix configurator */}
      <div className="bg-white border border-[#1A1815] p-5 mb-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-3">Customer Tier Mix · Current Pricing</div>
        <div className="space-y-2.5">
          <TierSlider label="Foundation (free)" value={foundationPct} setValue={setFoundationPct} price={0} />
          <TierSlider label="PoeTech+ ($39/mo)" value={plusPct} setValue={setPlusPct} price={39} />
          <TierSlider label="Family ($89/mo)" value={familyPct} setValue={setFamilyPct} price={89} />
          <TierSlider label="Premium ($149/mo)" value={premiumPct} setValue={setPremiumPct} price={149} />
          <TierSlider label="Business ($249/mo)" value={businessPct} setValue={setBusinessPct} price={249} />
        </div>
        <div className="mt-4 pt-4 border-t border-[#E8E4DC] grid grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
          <MetricCell label="Blended ARPU" value={`$${arpuMonthly.toFixed(2)}`} sub="per customer/mo" small />
          <MetricCell label="Annual ARPU" value={`$${arpuAnnual.toFixed(0)}`} sub="per customer/yr" small />
          <MetricCell label="Paying %" value={`${payingPct}%`} sub={totalPct < 100 ? `${100-totalPct}% free` : 'of customers'} small accent="green" />
        </div>
        <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Industry-typical freemium SaaS: 5-15% paying conversion. Calendly's free→paid is ~3%. The remaining {totalPct < 100 ? (100-totalPct) : 0}% is Loved Ones + Community tiers (free, sponsored).
        </p>
      </div>

      {/* Milestone table */}
      <div className="bg-white border border-[#1A1815]">
        <div className="grid grid-cols-12 gap-2 p-3 border-b-2 border-[#1A1815] text-[10px] uppercase tracking-wider text-[#5A5751] bg-[#FAF8F4]">
          <div className="col-span-3">Milestone</div>
          <div className="col-span-2 text-right">MRR</div>
          <div className="col-span-2 text-right">ARR</div>
          <div className="col-span-1 text-right">Year</div>
          <div className="col-span-4">Context</div>
        </div>
        {milestones.map((m, i) => {
          const mrr = m.customers * arpuMonthly;
          const arr = mrr * 12;
          return (
            <div key={m.customers} className={`p-3 ${i < milestones.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <div className="col-span-3">
                  <div className="text-base sm:text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{m.customers.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">families</div>
                </div>
                <div className="col-span-2 text-right">
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmtCompact(mrr)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">/mo</div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-[#5A6E3D]" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmtCompact(arr)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">/yr</div>
                </div>
                <div className="col-span-1 text-right">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Y{m.year}</div>
                </div>
                <div className="col-span-4">
                  <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{m.context}</div>
                  <div className="text-[10px] text-[#B85838] mt-0.5 italic">Poe family: {m.poeFamily}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Benchmarks */}
      <div className="bg-white border border-[#1A1815] p-5 mt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Comparable Trajectories</div>
        <div className="space-y-2 text-sm" style={{ fontFamily: '"Fraunces", serif' }}>
          <div className="flex justify-between gap-3">
            <span><strong>Calendly</strong> · Tope Awotona</span>
            <span className="text-[#5A5751] text-xs">$200K → $3B valuation in 8 years · bootstrapped</span>
          </div>
          <div className="flex justify-between gap-3">
            <span><strong>SimplePractice</strong> · Founded 2012</span>
            <span className="text-[#5A5751] text-xs">2 people → $1.5B exit in 9 years · clinical SaaS</span>
          </div>
          <div className="flex justify-between gap-3">
            <span><strong>Notion</strong> · Founded 2013</span>
            <span className="text-[#5A5751] text-xs">PLG → $10B valuation in 8 years · family-adjacent</span>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Compounding patience is the pattern. None of these were overnight successes. The bootstrapped path — Awotona's playbook — retains ownership and respects the Yahweh-approves filter.
        </p>
      </div>

      {/* Family-side projection */}
      <div className="bg-white border border-[#1A1815] p-5 mt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Multiple Paths to Be Fruitful</div>
        <h3 className="text-lg mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>What every family on PoeTech can do</h3>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Each PoeTech subscriber owns their data and gets the tools that compound their stewardship. The same patterns work for any family — not just ours.
        </p>
        <ul className="text-sm space-y-1.5 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Debt freedom</strong> via avalanche + pressure slider — typical family saves $5K-$50K in interest</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Rental snowball</strong> for landlords — 7-year payoff target with cascading freed cash flow</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Practice Operations</strong> for small business owners — inquiry capture, source attribution, conversion tracking</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Scope of Work mediation</strong> — fair contractor agreements protect both sides</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Marketplace participation</strong> (future) — earn from vendor positions or refer business</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Hardware DTC</strong> (future) — IoT sensors with PoeTech-controlled data pipeline</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Education tracking</strong> for kids — apprenticeship curricula, goal-setting, progress</span></li>
          <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Generational wealth path</strong> — own your data, own your assets, own your future</span></li>
        </ul>
      </div>
    </section>
  );
}

function TierSlider({ label, value, setValue, price }) {
  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1">
        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{label}</span>
        <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{value}%</span>
      </div>
      <input type="range" min="0" max="100" step="1" value={value} onChange={e => setValue(parseInt(e.target.value))} className="w-full accent-[#B85838]" />
    </div>
  );
}

// =============================================================================
// ABOUT — v7 with PRICING + STRONGHOLD MISSION
// =============================================================================
// =============================================================================
// PRACTICE — v9 NEW: Inquiry management for TLC Therapy Solutions
// Lead capture / inquiry tracking · pre-patient · NO PHI
// =============================================================================
const INQUIRY_SOURCES = [
  { key: 'church',       label: 'Church / parishioner' },
  { key: 'referral',     label: 'Personal referral' },
  { key: 'facebook',     label: 'Facebook' },
  { key: 'instagram',    label: 'Instagram' },
  { key: 'google',       label: 'Google search' },
  { key: 'website',      label: 'TLC website' },
  { key: 'word-of-mouth',label: 'Word of mouth' },
  { key: 'other',        label: 'Other' },
];

const INQUIRY_INTERESTS = [
  { key: 'individual',   label: 'Individual therapy' },
  { key: 'couples',      label: 'Couples therapy' },
  { key: 'family',       label: 'Family therapy' },
  { key: 'child',        label: 'Child / adolescent' },
  { key: 'group',        label: 'Group / support' },
  { key: 'consultation', label: 'Consultation only' },
  { key: 'unsure',       label: 'Not sure yet' },
];

const INQUIRY_STATUSES = [
  { key: 'new',                label: 'New',              color: 'rust',    group: 'active' },
  { key: 'attempting-contact', label: 'Attempting contact', color: 'rust',  group: 'active' },
  { key: 'contacted',          label: 'Contacted',        color: 'rust',    group: 'active' },
  { key: 'scheduled-intake',   label: 'Moved to Acuity ✓', color: 'green',  group: 'closed' },
  { key: 'declined',           label: 'Declined services', color: 'gray',   group: 'closed' },
  { key: 'lost',               label: 'No response',       color: 'gray',   group: 'closed' },
];

const TIMES_TO_CALL = ['morning','afternoon','evening','weekend','anytime'];

// Health insurance carriers commonly used in US mental health billing.
// `accepted: true` marks the carriers TLC Therapy Solutions has contracted
// with per the homepage advisement (BCBS, Aetna, UHC, Cigna, VA). They
// surface first in the dropdown with a checkmark.
const INSURANCE_CARRIERS = [
  { key: 'bcbs',      label: 'Blue Cross Blue Shield (BCBS)', accepted: true  },
  { key: 'aetna',     label: 'Aetna',                          accepted: true  },
  { key: 'uhc',       label: 'UnitedHealthcare (UHC)',         accepted: true  },
  { key: 'cigna',     label: 'Cigna',                          accepted: true  },
  { key: 'va',        label: 'VA / Veterans Affairs',          accepted: true  },
  { key: 'tricare',   label: 'Tricare (military)',             accepted: false },
  { key: 'medicare',  label: 'Medicare',                       accepted: false },
  { key: 'medicaid',  label: 'Medicaid / IL HFS',              accepted: false },
  { key: 'optum',     label: 'Optum (UHC behavioral)',         accepted: false },
  { key: 'magellan',  label: 'Magellan Health',                accepted: false },
  { key: 'beacon',    label: 'Beacon / Carelon Behavioral',    accepted: false },
  { key: 'humana',    label: 'Humana',                         accepted: false },
  { key: 'eap',       label: 'EAP (Employer Assistance)',      accepted: false },
  { key: 'self-pay',  label: 'Self-pay / private',             accepted: false },
  { key: 'unsure',    label: 'Unsure / need to verify',        accepted: false },
  { key: 'other',     label: 'Other (specify in notes)',       accepted: false },
];

// Map legacy hasInsurance values (Y/N/unsure) -> structured keys for display.
const insuranceLabel = (val) => {
  if (!val) return 'Unsure';
  if (val === 'Y' || val === 'yes') return 'Yes (carrier unspecified)';
  if (val === 'N' || val === 'no')  return 'Self-pay / private';
  const m = INSURANCE_CARRIERS.find(c => c.key === val);
  return m ? m.label + (m.accepted ? ' ✓' : '') : val;
};

function Practice({ inquiries, contractors, addInquiry, updateInquiry, deleteInquiry }) {
  const [mode, setMode] = useState('list');
  const [activeId, setActiveId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyInquiry());

  function emptyInquiry() {
    return { firstName: '', contactMethod: 'phone', contactValue: '', interestArea: 'unsure', hasInsurance: 'unsure', preferredProvider: 'any', bestTimeToCall: 'anytime', source: 'church', sourceDetail: '', notes: '' };
  }

  const mswContractors = contractors.filter(c => c.direction === 'outbound');

  const stats = useMemo(() => {
    const total = inquiries.length;
    const newCount = inquiries.filter(i => i.status === 'new').length;
    const inProgress = inquiries.filter(i => ['attempting-contact','contacted'].includes(i.status)).length;
    const converted = inquiries.filter(i => i.status === 'scheduled-intake').length;
    const declined = inquiries.filter(i => ['declined','lost'].includes(i.status)).length;
    const closed = converted + declined;
    const conversionRate = closed > 0 ? (converted / closed) * 100 : 0;
    const bySource = INQUIRY_SOURCES.map(s => ({ key: s.key, label: s.label, count: inquiries.filter(i => i.source === s.key).length })).filter(s => s.count > 0).sort((a,b) => b.count - a.count);
    return { total, newCount, inProgress, converted, declined, closed, conversionRate, bySource };
  }, [inquiries]);

  const visible = useMemo(() => {
    let list = [...inquiries];
    if (statusFilter === 'active') list = list.filter(i => INQUIRY_STATUSES.find(s => s.key === i.status)?.group === 'active');
    else if (statusFilter === 'closed') list = list.filter(i => INQUIRY_STATUSES.find(s => s.key === i.status)?.group === 'closed');
    else if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    return list.sort((a,b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  }, [inquiries, statusFilter]);

  const submit = () => {
    if (!form.firstName || !form.contactValue) { alert('First name and contact info are required.'); return; }
    addInquiry(form);
    setForm(emptyInquiry());
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {/* TLC Therapy Solutions integration banner */}
      <section className="bg-white border-2 border-[#1A1815] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">TLC Therapy Solutions</div>
            <h2 className="text-2xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Real Solutions for Real Life.</h2>
            <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Faith-integrated therapy. Online & in-person. Christina Poe, LCSW + clinical team.</p>
          </div>
          <a href="https://tlctherapysolutions-scheduleappointment.as.me/" target="_blank" rel="noopener noreferrer" className="bg-[#1A1815] text-[#FAF8F4] px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-[#B85838] whitespace-nowrap">📅 Book a Session →</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <a href="https://tlctherapysolutions.me/" target="_blank" rel="noopener noreferrer" className="border border-[#E8E4DC] p-2.5 hover:border-[#B85838]">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Site</div>
            <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>tlctherapysolutions.com →</div>
          </a>
          <a href="https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities" target="_blank" rel="noopener noreferrer" className="border border-[#E8E4DC] p-2.5 hover:border-[#B85838]">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Match a Therapist</div>
            <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Find Your Therapist →</div>
          </a>
          <a href="mailto:contact@tlctherapysolutions.com" className="border border-[#E8E4DC] p-2.5 hover:border-[#B85838]">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Direct Contact</div>
            <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>contact@tlctherapysolutions.com</div>
          </a>
        </div>
      </section>

      {/* Therapy Options · all link to Acuity booking */}
      <section>
        <SectionTitle eyebrow="Therapy Services">All Options · Direct Online Intake</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { name: 'Individual Therapy', desc: 'One-on-one · adult', for: 'Anxiety · depression · grief · life transitions · faith integration' },
            { name: 'Couples Therapy', desc: 'Marriage & relationships', for: 'Communication · conflict · pre-marital · rebuilding trust' },
            { name: 'Family Therapy', desc: 'Multi-generation work', for: 'Parent-child · sibling dynamics · blended families' },
            { name: 'Child & Adolescent', desc: 'Ages 6-17', for: 'Anxiety · school refusal · behavioral · trauma · identity' },
            { name: 'Group Therapy', desc: 'Themed cohort groups', for: 'Connection-based healing · processing in community' },
            { name: 'Clinical Consultation', desc: 'For pastors & professionals', for: 'Referral guidance · faith-clinical integration · supervision' },
          ].map(s => (
            <div key={s.name} className="bg-white border border-[#E8E4DC] p-3 hover:border-[#B85838] transition-colors">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <h4 className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.name}</h4>
                <a href="https://tlctherapysolutions-scheduleappointment.as.me/" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] whitespace-nowrap">Book →</a>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">{s.desc}</div>
              <p className="text-xs leading-snug text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{s.for}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Clinical team · roster with portal links */}
      <section>
        <SectionTitle eyebrow="Clinical Team">Match a Preferred Provider</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { name: 'Christina Poe, LCSW', role: 'Founder · Lead Clinician', specialty: 'Adult · couples · faith integration · clinical consult', url: 'https://tlctherapysolutions.me/christina-poe', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---christina-poe-AR01LXjXPBFJOGxN.jpg' },
            { name: 'Sheronda Smith-Williams', role: 'Specialist', specialty: 'Multicultural therapy · individual & family', url: 'https://tlctherapysolutions.me/sheronda-smith-williams', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---sheronda-smith-williams-ALp2egQZ9wS64pPW.jpg' },
            { name: 'Carolyn Nicole Johnson', role: 'Specialist', specialty: 'Child & adolescent · trauma-informed', url: 'https://tlctherapysolutions.me/carolyn-nicole-johnson', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---nicole-johnson-AR01N41P9Es3Xrb8.png' },
            { name: 'Candace Godbolt', role: 'Specialist', specialty: 'Multicultural therapy', url: 'https://tlctherapysolutions.me/candace-godbolt', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---candace-godbolt-m7VDvBz2n5te0wrl.jpeg' },
            { name: 'Wamaitha Sullivan', role: 'Specialist', specialty: 'Multicultural therapy', url: 'https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/headshot---wamaitha-sullivan-dJoPzQZMVaIJMPKW.jpg' },
            { name: 'Dr. Candace Gwin', role: 'Specialist', specialty: 'Clinical specialty services', url: 'https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---dr-candace-gwin-YD0ElbPRqnHxZqlv.jpg' },
            { name: 'Carileigh Jones', role: 'Specialist', specialty: 'Multicultural therapy', url: 'https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---carileigh-jones-m7VD3Xex4RUPGEwn.jpg' },
          ].map(c => (
            <a key={c.name} href={c.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] p-3 hover:border-[#B85838] transition-colors flex gap-3 items-start">
              <img src={c.photo} alt={c.name} loading="lazy" className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-[#E8E4DC] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} className="text-sm">{c.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#B85838] shrink-0">View →</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">{c.role}</div>
                <p className="text-xs leading-snug text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{c.specialty}</p>
              </div>
            </a>
          ))}
        </div>
        <div className="mt-3 p-3 bg-white border border-[#E8E4DC]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1">Insurance Accepted</div>
          <p className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
            Blue Cross Blue Shield · Aetna · United Health Care · Veterans Affairs · Cigna · Self-pay rates available
          </p>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="Practice Operations">Pre-Intake Inquiry Tracking</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Capture and track inquiries from prospective clients before they enter Acuity. <strong>No clinical detail. No PHI.</strong> Once an inquiry becomes a scheduled intake, the relationship moves to Acuity — the record of the inquiry stays here for marketing and source tracking only.
        </p>
      </section>      {/* Stats row */}
      <section className="grid grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
        <MetricCell label="Active" value={`${stats.newCount + stats.inProgress}`} sub={`${stats.newCount} new`} small accent="rust" />
        <MetricCell label="Converted" value={`${stats.converted}`} sub="to intake" small accent="green" />
        <MetricCell label="Declined" value={`${stats.declined}`} small />
        <MetricCell label="Conversion" value={stats.closed > 0 ? `${stats.conversionRate.toFixed(0)}%` : '—'} sub="of closed" small />
      </section>

      {/* Revenue projection — assumptions made explicit, replaces actual data once Acuity sync is built */}
      {stats.total > 0 && (
        <section className="bg-white border-2 border-[#5A6E3D] p-4 sm:p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-3">Pipeline Revenue · Estimates (until Acuity sync is built)</div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A5751]">Active pipeline</div>
              <div className="text-lg sm:text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact((stats.newCount + stats.inProgress) * (stats.conversionRate || 50) / 100 * 150 * 12)}</div>
              <div className="text-[9px] sm:text-[10px] text-[#5A5751]">expected annual · at current conv</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A5751]">Converted clients</div>
              <div className="text-lg sm:text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmtCompact(stats.converted * 150 * 12)}</div>
              <div className="text-[9px] sm:text-[10px] text-[#5A5751]">annual recurring est.</div>
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold">If all active convert</div>
              <div className="text-xl sm:text-3xl text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmtCompact((stats.newCount + stats.inProgress) * 150 * 12)}</div>
              <div className="text-[9px] sm:text-[10px] text-[#5A5751]">upside</div>
            </div>
          </div>
          <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            Assumptions: ~$150/session avg blended (insurance + self-pay), 1 session/week, 48 weeks/year (~$7.2K/client/yr). Estimates only until Acuity integration syncs actual booked + completed session data.
          </p>
        </section>
      )}

      {/* Source breakdown */}
      {stats.bySource.length > 0 && (
        <section className="bg-white border border-[#1A1815] p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">By source</div>
          <div className="space-y-1.5">
            {stats.bySource.map(s => {
              const pct = (s.count / stats.total) * 100;
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{s.label}</span>
                    <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-[#E8E4DC]"><div className="h-full bg-[#B85838]" style={{ width: `${pct}%` }}></div></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Add inquiry */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Inquiries · {visible.length}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 text-[10px] uppercase tracking-wider">
              {[['active','Active'],['closed','Closed'],['all','All']].map(([k, l]) => (
                <button key={k} onClick={() => setStatusFilter(k)} className={`px-2 py-1 ${statusFilter === k ? 'bg-[#1A1815] text-white' : 'text-[#5A5751]'}`}>{l}</button>
              ))}
            </div>
            <button type="button" onClick={() => setShowForm(!showForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Log inquiry'}</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New inquiry</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">First name *</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Sarah" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact method</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.contactMethod} onChange={e => setForm({...form, contactMethod: e.target.value})}>
                  <option value="phone">Phone</option><option value="email">Email</option><option value="text">Text</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact info *</label>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder={form.contactMethod === 'email' ? 'sarah@example.com' : '555-555-1234'} value={form.contactValue} onChange={e => setForm({...form, contactValue: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Interest area</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.interestArea} onChange={e => setForm({...form, interestArea: e.target.value})}>
                  {INQUIRY_INTERESTS.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Has insurance?</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.hasInsurance} onChange={e => setForm({...form, hasInsurance: e.target.value})}>
                  <optgroup label="✓ Accepted by TLC (in-network)">
                    {INSURANCE_CARRIERS.filter(c => c.accepted).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </optgroup>
                  <optgroup label="Other carriers / out-of-network">
                    {INSURANCE_CARRIERS.filter(c => !c.accepted).map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Preferred provider</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.preferredProvider} onChange={e => setForm({...form, preferredProvider: e.target.value})}>
                  <option value="any">Any provider</option>
                  <option value="christina">Christina</option>
                  {mswContractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Best time to reach</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.bestTimeToCall} onChange={e => setForm({...form, bestTimeToCall: e.target.value})}>
                  {TIMES_TO_CALL.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">How did they hear about us?</label>
              <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                {INQUIRY_SOURCES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] mt-1.5" placeholder="Source detail (e.g., 'Sister Margaret', 'Sunday bulletin', specific FB ad name)" value={form.sourceDetail} onChange={e => setForm({...form, sourceDetail: e.target.value})} />
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes (no clinical detail)</label>
              <textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="General context only — e.g., 'Asked about evening availability', 'Friend of Lisa from choir'" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Log Inquiry</button>
            <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              Reminder: do not record clinical history, diagnoses, presenting concerns, or anything that would be PHI. Move the relationship to Acuity for actual intake.
            </p>
          </div>
        )}

        {visible.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              {inquiries.length === 0 ? "No inquiries yet. Click '+ Log inquiry' to record the next one that comes in by phone, email, or referral." : `No inquiries in '${statusFilter}' status. Switch the filter above.`}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {visible.map((inq, i) => <InquiryRow key={inq.id} inq={inq} contractors={mswContractors} updateInquiry={updateInquiry} deleteInquiry={deleteInquiry} isLast={i === visible.length - 1} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function InquiryRow({ inq, contractors, updateInquiry, deleteInquiry, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  // v28+ Conversation log per inquiry (mirrors property records)
  const [showConvForm, setShowConvForm] = useState(false);
  const [convForm, setConvForm] = useState({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const addConvNote = () => {
    if (!convForm.summary) { alert('Summary is required.'); return; }
    const entry = { ...convForm, id: `cv-${Date.now()}` };
    updateInquiry(inq.id, { conversationLog: [...(inq.conversationLog || []), entry] });
    setConvForm({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
    setShowConvForm(false);
  };
  const deleteConvNote = (entryId) => {
    if (!confirm('Delete this conversation note?')) return;
    updateInquiry(inq.id, { conversationLog: (inq.conversationLog || []).filter(e => e.id !== entryId) });
  };
  const statusInfo = INQUIRY_STATUSES.find(s => s.key === inq.status) || INQUIRY_STATUSES[0];
  const sourceInfo = INQUIRY_SOURCES.find(s => s.key === inq.source);
  const interestInfo = INQUIRY_INTERESTS.find(i => i.key === inq.interestArea);
  const providerLabel = inq.preferredProvider === 'any' ? 'any provider' : inq.preferredProvider === 'christina' ? 'Christina' : (contractors.find(c => c.id === inq.preferredProvider)?.name || inq.preferredProvider);
  const receivedDate = new Date(inq.receivedAt);
  const daysAgo = Math.floor((Date.now() - receivedDate.getTime()) / 86400000);

  const changeStatus = (newStatus) => {
    updateInquiry(inq.id, { status: newStatus, statusNotes });
    setStatusNotes('');
  };

  const statusColor = statusInfo.color === 'green' ? 'text-[#5A6E3D]' : statusInfo.color === 'rust' ? 'text-[#B85838]' : 'text-[#5A5751]';

  return (
    <div className={`p-3 ${!isLast ? 'border-b border-[#E8E4DC]' : ''}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{inq.firstName}</span>
            <span className={`text-[10px] uppercase tracking-wider font-medium ${statusColor}`}>{statusInfo.label}</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5">
            {daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`} · {sourceInfo?.label} · {interestInfo?.label}
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 shrink-0">
          <button type="button" onClick={() => setExpanded(!expanded)} className="text-[10px] uppercase tracking-wider text-[#5A5751]">{expanded ? '× Close' : 'Details'}</button>
          <button type="button" onClick={() => { if (confirm('Delete this inquiry?')) deleteInquiry(inq.id); }} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#E8E4DC] space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Contact</div>
              <div style={{ fontFamily: '"Fraunces", serif' }}>{inq.contactValue}</div>
              <div className="text-[10px] text-[#5A5751]">{inq.contactMethod} · best: {inq.bestTimeToCall}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Provider</div>
              <div style={{ fontFamily: '"Fraunces", serif' }}>{providerLabel}</div>
              <div className="text-[10px] text-[#5A5751]">Insurance: {insuranceLabel(inq.hasInsurance)}</div>
            </div>
          </div>

          {inq.sourceDetail && (<div><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Source detail</div><div className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{inq.sourceDetail}</div></div>)}
          {inq.notes && (<div><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes</div><div className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{inq.notes}</div></div>)}

          <div>
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1.5">Update status</div>
            <input className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4] mb-1.5" placeholder="Optional: notes on this status change" value={statusNotes} onChange={e => setStatusNotes(e.target.value)} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {INQUIRY_STATUSES.filter(s => s.key !== inq.status).map(s => (
                <button key={s.key} onClick={() => changeStatus(s.key)} className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#E8E4DC] hover:border-[#B85838] hover:bg-[#FAF8F4]">{s.label}</button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#E8E4DC]">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">💬 Conversation Log · {(inq.conversationLog || []).length}</div>
              <button type="button" onClick={() => setShowConvForm(!showConvForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showConvForm ? '× Cancel' : '+ Log a call / message'}</button>
            </div>
            {showConvForm && (
              <div className="bg-white border border-[#B85838] p-2 mb-2 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <input type="date" className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" value={convForm.date} onChange={e => setConvForm({ ...convForm, date: e.target.value })} />
                  <input className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Who: Christina / Maya / VM left" value={convForm.person} onChange={e => setConvForm({ ...convForm, person: e.target.value })} />
                </div>
                <input className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Summary (required) — e.g., 'verified BCBS, scheduled intake for 5/19 11am'" value={convForm.summary} onChange={e => setConvForm({ ...convForm, summary: e.target.value })} />
                <textarea className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" rows="2" placeholder="Notes · tone · next step · what to send afterward" value={convForm.notes} onChange={e => setConvForm({ ...convForm, notes: e.target.value })} />
                <button type="button" onClick={addConvNote} className="w-full bg-[#1A1815] text-white py-1.5 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Note</button>
              </div>
            )}
            {(inq.conversationLog || []).length === 0 && !showConvForm ? (
              <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No conversation notes yet.</p>
            ) : (
              <div className="space-y-1">
                {[...(inq.conversationLog || [])].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                  <div key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{e.date}{e.person ? ` · ${e.person}` : ''}</div>
                        <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.summary}</div>
                        {e.notes && <div className="text-[10px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.notes}</div>}
                      </div>
                      <button type="button" onClick={() => deleteConvNote(e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {inq.statusHistory && inq.statusHistory.length > 1 && (
            <div>
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">History</div>
              <div className="space-y-0.5 text-[10px] text-[#5A5751]">
                {[...inq.statusHistory].reverse().map((h, i) => (
                  <div key={i}>
                    {new Date(h.at).toLocaleDateString()} — {INQUIRY_STATUSES.find(s => s.key === h.status)?.label || h.status}
                    {h.notes && <span className="italic"> · "{h.notes}"</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function About({ moduleInterest, toggleModuleInterest, theme, setTheme, feedback = [], deleteFeedback, checkoutIntents = [], addCheckoutIntent, deleteCheckoutIntent, addProject }) {
  // v28+ MVP v1.5 round 3 — Capex / Tools list moved out of About; lives at the
  // bottom of the Projects tab as "Project Inventory & Capital Forecast".
  // v28+ Session C: checkout cart drawer state
  const [cartTier, setCartTier] = useState(null);
  const [cartBilling, setCartBilling] = useState('monthly');
  const [cartName, setCartName] = useState('');
  const [cartEmail, setCartEmail] = useState('');
  const [cartNotes, setCartNotes] = useState('');
  const [cartError, setCartError] = useState('');
  const openCart = (tier) => { setCartTier(tier); setCartBilling('monthly'); setCartName(''); setCartEmail(''); setCartNotes(''); setCartError(''); };
  const closeCart = () => setCartTier(null);
  // v28+ Auto-create a Project when someone submits the cart. Each tier gets a
  // sensible default onboarding timeline so the team knows what they're walking
  // into before the discovery call. User can edit start/end/hours later.
  const tierToProjectTemplate = (tier, customerName, customerEmail, action) => {
    const today = new Date(); const isoToday = today.toISOString().slice(0, 10);
    const tierName = tier.name || 'tier';
    const monthly = tier.monthly;
    const isSponsor = !!tier.isSponsor;
    let weeks = 1, hpw = 1, domain = 'business-poetech';
    if (isSponsor) { weeks = 3; hpw = 4; domain = 'business-poetech'; }
    else if (monthly === '0' && /Loved Ones/i.test(tierName)) { weeks = 2; hpw = 2; }
    else if (monthly === '0' && /Community/i.test(tierName))  { weeks = 2; hpw = 1; }
    else if (monthly === '0')                                  { weeks = 1; hpw = 1; } // Foundation
    else if (monthly === '39')                                 { weeks = 1; hpw = 1; } // PoeTech+
    else if (monthly === '89')                                 { weeks = 2; hpw = 2; } // Family
    else if (monthly === '149')                                { weeks = 3; hpw = 3; } // Premium
    else if (monthly === '249')                                { weeks = 5; hpw = 5; } // Business
    const end = new Date(today.getTime() + weeks * 7 * 86400000).toISOString().slice(0, 10);
    const actionLabel = action === 'sponsor' ? 'Sponsor' : action === 'claim' ? 'Claim' : 'Subscribe';
    return {
      title: `${actionLabel} · ${customerName} · ${tierName}`,
      startDate: isoToday,
      endDate: end,
      status: 'planning',
      domain,
      description: `Auto-created from About checkout. Customer email: ${customerEmail}. Tier: ${tierName}. ${isSponsor ? 'Sponsor flow - vetting runs in parallel; refund if vetting fails.' : monthly === '0' ? 'Free-tier onboarding - enable access and orient.' : `Paid tier onboarding (${weeks}-week target).`} Confirm timeline with customer on first call.`,
      hoursPerWeek: hpw,
      entityId: 'e-poetech',
      contractorIds: [],
      conversationLog: [],
    };
  };

  const submitCart = (action) => {
    if (!cartTier) return;
    if (!cartName || !cartEmail) { setCartError('Name and email are required so we can follow up.'); return; }
    setCartError('');
    const isFree = cartTier.monthly === '0';
    const isSponsor = !!cartTier.isSponsor;
    const billing = isSponsor ? 'annual' : (isFree ? 'free' : cartBilling);
    const price = isSponsor ? parseFloat(cartTier.annual) || 0
                : isFree ? 0
                : parseFloat(cartBilling === 'annual' ? cartTier.annual : cartTier.monthly) || 0;
    addCheckoutIntent({
      tierName: cartTier.name,
      tierTagline: cartTier.tagline,
      billing,
      price,
      name: cartName,
      email: cartEmail,
      notes: cartNotes,
      action, // 'subscribe' | 'claim' | 'sponsor'
      status: 'new',
    });
    // Mirror to Projects so the team has a tracked record + timeline before the call
    if (typeof addProject === 'function') {
      addProject(tierToProjectTemplate(cartTier, cartName, cartEmail, action));
    }
    // Open mailto so user can complete the handshake via email until Stripe is wired in
    const subject = isSponsor ? `Sponsor: ${cartTier.name}`
                  : isFree ? `Claim: ${cartTier.name}`
                  : `Subscribe: ${cartTier.name} (${cartBilling})`;
    const billingLine = isSponsor ? `Sponsorship: annual ($${price.toLocaleString()})`
                      : isFree ? 'Free tier - claiming access'
                      : `Billing: ${cartBilling} ($${price})`;
    const body = `Name: ${cartName}\nEmail: ${cartEmail}\nTier: ${cartTier.name}\n${billingLine}\n\nNotes:\n${cartNotes || '(none)'}`;
    const url = `mailto:contact@poetech.us?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try { window.location.href = url; } catch (e) {}
    closeCart();
  };
  return (
    <div className="space-y-10 max-w-prose">
      <section>
        <SectionTitle>Pricing · Premium Positioning</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          The Financial Control System is free for every family. Paid tiers reflect the real value being delivered — each one replaces multiple existing SaaS subscriptions. PoeTech is priced like the premium platform it is, not like a hobby app. <strong>Free access at two layers</strong> for the work of justice: families served by partner orgs, and the mission-aligned orgs themselves.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Round 5 — Tier features rewritten to match the live tier-gating map.
              Every bullet here corresponds to something that's actually unlocked
              or capped at that tier in the running app (see VIEW_TIER_REQUIREMENTS). */}
          <PricingTier name="Foundation" tagline="Always free · core financial control" monthly="0" annual="0" replaces="YNAB, basic budget apps, free family planners — typically $50–$100/mo equivalent" features={['Big Picture dashboard + Action Queue (Changes / Incidents / Projects)','Books — entities · accounts · transactions · calendar · 1099 (cap: 2 entities)','Debts — avalanche + snowball strategies','Markets watchlist (cap: 5 tickers)','Church tab — always free for everyone','Dev/Ops tab — 1 personalized entrepreneurial option per profile · view-only PoeTech Services portfolio','Real Estate — read-only preview (sample property)','Event reminders (browser)','Local-first · device-only storage']} highlight onChoose={openCart} />
          <PricingTier name="PoeTech+" tagline="Real Estate unlocked · unlimited Books + Markets" monthly="39" annual="390" replaces="$100–$200/mo equivalent: paid YNAB tier, Stessa (rentals), encrypted backup services" features={['Everything in Foundation','Real Estate — up to 3 properties (full edit: lease · tenant · equipment · rooms · maintenance · conversations · evaluator · map)','Unlimited entities in Books','Unlimited Markets watchlist','Dev/Ops — 3 personalized options per profile','Cross-device sync (opt-in cloud, when backend ships)','Encrypted cloud backup','Priority email support']} onChoose={openCart} />
          <PricingTier name="Family" tagline="+ Projects tab · unlimited Real Estate" monthly="89" annual="890" replaces="$200–$350/mo equivalent: Notion/Asana for family ops + rental SaaS + maintenance apps" features={['Everything in PoeTech+','Real Estate — unlimited properties','Projects tab — multi-domain timeline + workload + per-project conversations','Dev/Ops — full opportunity library (6+ matched options per profile)','Home Command Center module (when launched)','Seasonal maintenance calendar · IoT sensor pairing (planned)','Multi-user household sharing (opt-in)']} onChoose={openCart} />
          <PricingTier name="Premium" tagline="Practice + Wrap-me handoff + Scope tool + Inventory Forecast" monthly="149" annual="1490" replaces="$400–$700/mo equivalent: Practice Better / SimplePractice ($75–$150), QuickBooks Self-Employed ($30), CRM ($30–50), project tools ($20–40), scheduling, scope/contract tools" features={['Everything in Family','Practice Operations tab — inquiry capture · source attribution · conversion tracking (non-PHI)','Dev/Ops — "Wrap me with the tech" CTA enabled (auto-create Project + Scope + Capex from any opportunity)','Scope-of-work agreements (full templates · materials-paid-by policy)','Project Inventory & Capital Forecast — 12-month outflow projection + savings prompts','Education / Tutors / Elder Care modules (when launched)','Marketplace access (when launched)','Spiritual Life · Godhead Study Platform (always free for every tier)']} onChoose={openCart} />
          <PricingTier name="PoeTech Business" tagline="Multi-entity · multi-user · advanced controls" monthly="249" annual="2490" replaces="$700–$1,200/mo equivalent: QuickBooks multi-entity ($90+), full CRM, marketing stack, payroll integration, EHR-adjacent practice tools, audit/compliance software" features={['Everything in Premium','Up to 10 entities tracked','Up to 5 staff / team users (when backend ships)','Advanced reporting + CSV/Excel bulk export','1099-NEC e-file integration','Audit log + change history','API access for custom integrations','Priority phone + Slack support','Quarterly strategy review with PoeTech Services','Eligible for revenue-share consulting partnership']} business onChoose={openCart} />
          <PricingTier name="Loved Ones · Founding Family" tagline="Free PoeTech+ upgrade for life · First 100 families through Church of the Living God or by direct invitation" monthly="0" annual="0" replaces="Lifetime savings of ~$468/yr per family at current prices · more as prices rise" features={['Everything in Foundation','Cross-device sync (opt-in cloud)','Encrypted cloud backup','Multi-user household sharing','Locked in for life — even when prices change','First 100 families only · tier closes when filled','One month Family-tier credit per paying family you refer']} community onChoose={openCart} />
          <PricingTier name="Community · Families in Need" tagline="Free access for families · sponsored by paying subscribers" monthly="0" annual="0" features={['Available through partner Churches','And 501(c)(3) organizations serving the poor, elderly, fatherless','Verification through partner org · not the family','Full Foundation + PoeTech+ features','Designed to remove stigma — help comes from the community','Paying subscribers fund this tier transparently']} community onChoose={openCart} />
          <PricingTier name="Community Partners · Organizations" tagline="Free PoeTech for mission-aligned orgs that serve the underserved" monthly="0" annual="0" features={['Free for verified 501(c)(3) nonprofits + faith-based ministries','Serving: poor · elderly · fatherless · incarcerated/reentry · unhoused · disabled · mental health · literacy','Full PoeTech platform for the organization itself','Practice Operations for case management (no PHI)','Aggregate community-trend data for advocacy and grant applications','Custom data exports for board meetings, funders, and community awareness','Listed in PoeTech Community Partners directory','Verified annually · service area documented · mission alignment confirmed']} community onChoose={openCart} />
        </div>
        <p className="text-xs text-[#5A5751] italic mt-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Annual pricing reflects ~17% savings (2 months free). Foundation is free forever — to generate the experience and the data that improves the system for every family. Loved Ones tier honors the warm-market relationships that make PoeTech viable: people who already know us, trust us, and pray for us. Their early adoption is the foundation everything else stands on — and their pricing is locked even as the broader pricing reflects the platform's growing value.
        </p>
      </section>

      {feedback.length > 0 && (
        <section className="bg-white border-2 border-[#B85838] p-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-2 font-semibold">💬 Feedback Log · MVP Test</div>
          <h3 className="text-xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>What testers have shared ({feedback.length})</h3>
          <div className="space-y-3">
            {[...feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(f => (
              <div key={f.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
                <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
                  <div className="text-[10px] uppercase tracking-wider">
                    <span className="font-semibold text-[#B85838]">{f.area}</span>
                    {f.rating && <span className="text-[#5A5751]"> · {f.rating}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                    <button type="button" onClick={() => { if (confirm('Delete this feedback?')) deleteFeedback(f.id); }} className="text-[9px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838]">×</button>
                  </div>
                </div>
                {f.whatsWorking && <div className="mb-1"><div className="text-[9px] uppercase tracking-wider text-[#5A6E3D] font-semibold">✓ Working</div><p className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsWorking}</p></div>}
                {f.whatsNot && <div className="mb-1"><div className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">✗ Not working</div><p className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsNot}</p></div>}
                {f.whatsMissing && <div className="mb-1"><div className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">+ Missing</div><p className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{f.whatsMissing}</p></div>}
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="bg-white border border-[#E8E4DC] p-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">Appearance · Themes</div>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Switch themes from the swatches in the header (top-right) anytime. Editorial cream is the default · five total themes including a true dark mode.
        </p>
      </section>
      <section>
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2">PoeTech LLC · poetech.us</div>
        <h2 className="text-3xl sm:text-4xl mb-4 leading-tight" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>A stronghold for relationships with Yahweh.</h2>
        <p className="text-base leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          PoeTech exists to help families be supported in their relationship with Yahweh — to make His voice easier to hear and easier to follow. The Family OS is the practical infrastructure: financial visibility, home stewardship, health awareness, scope-of-work fairness. Each module serves the larger mission.
        </p>
        <p className="text-base leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>Built for every family that owns their own story.</strong> Multiple paths to succeed. Multiple ways to earn. Multiple ways to be fruitful. One platform that respects your data and amplifies your stewardship — not extracts from it.
        </p>
        <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>Local-first by default.</strong> Your data stays on your devices. Cloud sync is opt-in for historical stability across devices. We do not sell or mine your family's data — that's foundational, not a feature.
        </p>
        <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Projections, not promises. Better stewardship through technology — alongside qualified professionals and the church community, not replacing them.
        </p>
      </section>

      <section>
        <SectionTitle>Modules</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Live modules ship to all subscribers. Planned and Vision modules accept early interest signals — tap <strong>Notify me · vote on priority</strong> to register and weigh in on what gets built next. The aggregate of family priority votes shapes the roadmap.
        </p>
        <CommunityPriorities moduleInterest={moduleInterest} />
        <div className="space-y-3">
          <ModuleCard moduleKey="financial" status="active" title="Financial Control System" desc="Multi-entity bookkeeping with debt avalanche, rental snowball, pressure slider, tax calendar, 1099 tracking, scope-of-work agreements, event reminders." features={['4-entity book separation','Debt avalanche · rental snowball','7-year Sabbath payoff goal','Tax & compliance calendar','Events with browser notifications','Scope of work templates & agreements','1099 tracking · both directions']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="home-command" status="planned" title="Home Command Center" repo="poe-trust-command-center" desc="BAS-level intelligence for the residential home. UIUC F&S Siemens thinking applied to family stewardship." features={['IoT sensor integration','F&S-level alarms (leak, intrusion, HVAC failure)','Seasonal maintenance calendar','Floor plan mapping & inventory','Per-property dashboards']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="health-wellness" status="planned" title="Health & Wellness · PoeTech-PWA" repo="poetech.us" desc="Public-facing health stewardship. IoT and sensor data for big-picture private health visibility." features={['IoT health data aggregation','Big-picture private health dashboard','Comprehensive measurement incl. water sensors','Facial recognition AI trained for Black families (NIST-documented accuracy gaps — opt-in correction)','Open-source where possible']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="marketplace" status="vision" title="PoeTech Marketplace · Scope & Contractors" desc="Vendor marketplace where PoeTech mediates the scope agreement itself — protecting both customer and contractor from unfair disputes." features={['Vendor onboarding with paid positions','Scope-mediated agreements (the differentiator)','Reviews anchored to agreed scope','Trade-specific templates','Trust & safety verification']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="practice-ops" status="active" title="Practice Operations · TLC" desc="Non-PHI tooling around Christina's clinical practice. Inquiry capture, source attribution, and pre-patient lead tracking — running in the app today. Acuity remains the system of record for client scheduling and intake." features={['Inquiry capture form (pre-patient, no PHI)','Status workflow: new → contacted → moved to Acuity','Source attribution (organic / FB / referral / church)','Conversion rate tracking','Per-provider routing (Christina + MSW contractors)','MSW contractor onboarding (uses scope tool)','Acuity API integration (planned)','Revenue-per-session reconciliation (planned)']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="marketing-growth" status="vision" title="Marketing & Growth" desc="Help PoeTech subscribers grow their own ministry, practice, or business through integrated social media management, ad attribution, and SEO tools — all under the local-first privacy posture." features={['Facebook + Instagram (Meta) ads attribution','Google Ads tracking','Content calendar across social channels','Email + SMS campaigns (where lawful)','Google My Business + local SEO health','Lead source data into Practice Operations','Audience insights without surveillance capitalism']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="education" status="vision" title="Education & Children · Literacy Justice" desc="&quot;From us for us&quot; — designed by Black families, for Black families. Children not reading proficiently by 3rd grade are 4-8x more likely to drop out of high school. 30-50% of incarcerated individuals have dyslexia (vs 5-15% general population). Technology can help break this pattern through early screening, dyslexia-aware design, and family-supervised AI literacy." features={['AI literacy curriculum for kids (age-appropriate prompt engineering, AI safety, fact-checking AI output)','Dyslexia-aware interface (OpenDyslexic / Lexend fonts, color overlays, line tracking)','Voice-to-text and text-to-speech throughout','Early literacy screening · intervention tracking before 3rd grade','Per-child reading proficiency dashboard','Apprenticeship curriculum tracking','Goal-setting & review cycles','Pricing: Family of 3: $19/mo · Family of 5+: $29/mo · Included in Premium tier']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="tutors" status="vision" title="PoeTech Tutors · Educator Marketplace" desc="Credentialed teachers and school principals earn meaningful income teaching online — specifically serving parents who pulled their kids into homeschooling because of bullying, special needs, or simply because the local school wasn't the right fit. From us, for us. Real educators, real outcomes, real freedom for the parents." features={['Marketplace for vetted teachers and principals to list availability + rates','Booking + scheduling integrated with PoeTech calendar','Specializations: special needs, dyslexia support, IEP advocacy, college-prep, bullied-kids homeschool transitions','Curriculum alignment with state homeschool requirements','Per-student progress tracking shared with parents','Standard split: 80% to educator · 20% to PoeTech (platform fee)','Or: revenue-share partnership for teachers building a full online practice','Free marketplace access for Premium subscribers · session pricing set by educator','Community-tier families receive subsidized sessions through underwriting','Pre-launch interest welcome — vote on priority']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="elder-care-coord" status="vision" title="Elder Care Coordination" desc="For adult children managing care for aging parents. The forgotten generation in family-tech — most platforms focus on the kids or the parents themselves, not the family member doing the coordination work. Built on the same calendar, scope, and practice operations primitives already shipping today." features={['Multi-generational household tracking','Caregiver scheduling and 1099 management (uses scope tool)','Appointment + medication reminder calendar','Document storage (Power of Attorney, advance directives, HIPAA releases)','Shared access for siblings managing care together','Aging-in-place property maintenance tracking','Financial visibility across parent + adult-child budgets','Connection to Elder Care Marketplace (caregivers, helpers)']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="home-legacy" status="vision" title="Home Legacy Program · Poe Properties extension" desc="Ethical purchase program for elderly homeowners who want certainty their home will be cared for after they pass — when family inheritance isn't a clean option. Not a marketplace. Not a flip. Relationship-based, attorney-required, family-involved when possible. This is genuinely sensitive territory; we approach it with deep care because Yahweh names the elderly as deserving particular care." features={['Years of relationship before any purchase conversation','Elderly homeowner ALWAYS has their own attorney (we pay if needed)','Family involvement required when family exists','Fair market value pricing · independently documented','Life estate option — they live there until death, paid up front or monthly','Property maintenance commitment baked into the agreement','No high-pressure sales · they walk if they want','Elder abuse prevention training for everyone involved','Transparent reporting of every transaction to a community advisory board','Alternative to probate sales and state escheat']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="spiritual" status="vision" title="Spiritual Life · The Godhead Study Platform" desc="An interactive tool for studying The Godhead, original business systems from a biblical worldview, and the philosophy of technology in light of scripture. FREE for every family — Foundation tier and above. The Poe family worldview, derived from biblical scriptures with algorithmic rigor, made interactive. A stronghold made visible in daily study." features={['FREE tier — included with every PoeTech subscription including Foundation','Interactive Godhead study (Father · Son · Holy Spirit · their unity and distinction)','Original Business Systems study — biblical economics, stewardship, the seven-year cycle, debt-jubilee patterns','Technology Study — philosophy of technology from a biblical worldview','Built-in Bookstore — digital download + Amazon physical order','📖 The Holy Spirit Integration Worldview (Darrell Poe, forthcoming) — the foundational text','📖 Christina Poe (forthcoming) — clinical & community wisdom','Family prayer journal · scripture study plans · ministry calendar','Algorithm-driven study paths · personalized scripture walks','Local-first study notes · device-only by default']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
        </div>
      </section>

      {/* v28+ MVP v1.5 round 3 — Capex / Tools list moved to Projects tab.
          Lives at the bottom of Projects as "Project Inventory & Capital
          Forecast" because tools/equipment are most actionable next to the
          projects that need them. About no longer hosts the editor. */}

      <section>
        <SectionTitle>Markets We Serve · Underserved by Mainstream Tech</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Most family-tech is built for one demographic: the affluent, single-business, two-parent household. Real families are more complex than that. PoeTech is built for the populations mainstream tech overlooks — and the existing platform already covers many of them today, no new modules required.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MarketCard title="Adult children caring for aging parents" need="Coordinate caregivers, track appointments, manage finances across generations" have="Multi-entity books, calendar, reminders, scope-of-work — Premium tier" />
          <MarketCard title="Kinship caregivers (grandparents raising grandkids)" need="Document everything for agencies/courts, manage 1099 helpers, track therapy" have="Practice Operations, calendar, scope — Premium tier" />
          <MarketCard title="Foster families" need="Placement tracking, court dates, agency contacts, supplemental contractors" have="Practice Operations, calendar, scope" />
          <MarketCard title="Reentry / formerly incarcerated families" need="Financial rebuilding from zero, court dates, family reunification logistics" have="Foundation tier (free) — debt snowball is especially powerful here" />
          <MarketCard title="Single-parent small business owners" need="One platform vs juggling SaaS, lead tracking, tax preparation" have="Premium tier — replaces $400-$600/mo of SaaS" />
          <MarketCard title="Small Black-owned contractors & service providers" need="Multi-entity tracking, fair contractor agreements, lead source attribution" have="Premium + Scope tool · From us, for us" />
          <MarketCard title="Independent farmers & small homesteaders" need="Property + equipment + seasonal calendar + multiple income streams" have="Family tier covers this almost completely" />
          <MarketCard title="Small churches & ministries" need="Volunteer coordination, event tracking, member care, donation tracking" have="Calendar + Practice Operations workflow · Community Partner tier free" />
          <MarketCard title="Disability advocate / IEP families" need="Document management, multi-provider coordination, school + therapist + insurance" have="Calendar + Practice Operations + scope · Premium tier" />
          <MarketCard title="Direct-care workers & gig economy" need="Multi-source income tracking, mileage, quarterly tax planning" have="Foundation (free) + Premium for full features" />
        </div>
        <p className="text-xs text-[#5A5751] italic mt-4" style={{ fontFamily: '"Fraunces", serif' }}>
          The breadth of who PoeTech serves is also the breadth of who benefits from local-first data, non-predatory pricing, and a stronghold mission. Every market named above has been underserved by mainstream tech because they don't fit the &quot;single business owner, single household, single problem&quot; pattern. We were built for the actual texture of family life.
        </p>
      </section>


      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Community Partnership Model</div>
        <p className="text-sm leading-relaxed mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          PoeTech is free at two layers for the work of justice. <strong>Families in need</strong> — the poor, the elderly, the fatherless, those Yahweh names as deserving particular care — receive full access through partner churches and 501(c)(3)s the family already trusts. The verification and dignity-preserving handoff happens through the partner org, not from PoeTech.
        </p>
        <p className="text-sm leading-relaxed mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>The organizations themselves</strong> — mission-aligned nonprofits doing the actual work of serving these communities — get PoeTech free for their own operations, plus aggregate community-trend data to advocate, apply for grants, and keep all of us aware of what's happening on the ground.
        </p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Paying subscribers know transparently that their subscription funds both tiers. No charity badge appears on the recipient's app. No data-driven judgment of worthiness from PoeTech. The community gives. The community receives. The data infrastructure compounds the work.
        </p>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-2 font-semibold">PoeTech Bookstore · Forthcoming</div>
        <h3 className="text-xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Original work. From us, for the families.</h3>
        <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          The Spiritual Life module is free for every family — but inside it lives a bookstore for original works that fund the platform and propagate the worldview. Digital download for instant access · physical copies fulfilled through Amazon for those who want to hold the book.
        </p>
        <div className="space-y-3">
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>📖 The Holy Spirit Integration Worldview</h4>
              <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-medium">Forthcoming</span>
            </div>
            <div className="text-xs text-[#5A5751] mb-2">Darrell Poe</div>
            <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              The foundational text. A biblical-scripture-derived worldview applied with algorithmic rigor — covering The Godhead, original business systems (biblical economics, the seven-year cycle, debt-jubilee patterns), and the philosophy of technology. The intellectual spine of the Spiritual Life module.
            </p>
          </div>
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>📖 Christina Poe — Title TBD</h4>
              <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-medium">Forthcoming</span>
            </div>
            <div className="text-xs text-[#5A5751] mb-2">Christina Poe, MSW</div>
            <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              Clinical wisdom and community insight from twenty years of social work and faith-based therapy. The complementary text — bringing the worldview into the lived reality of family mental health, marriage, parenting, and community care.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#E8E4DC]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-semibold mb-1">Distribution strategy</div>
          <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Digital download in-app</strong> — instant access for PoeTech families, payment through Stripe, file delivered to local device (local-first principle)</span></li>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Physical copies via Amazon KDP</strong> — print-on-demand fulfillment, widest distribution, no inventory risk · alternatives: IngramSpark for bookstores, BookBaby for premium options</span></li>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Best deal evaluation</strong> — KDP is industry standard (40-60% royalty on paperback, 70% on Kindle); IngramSpark gets into libraries and indie bookstores; BookBaby offers more royalty but higher upfront. The book is the priority; the distribution serves it.</span></li>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Family pricing</strong> — Loved Ones tier families get founding-pricing access · Community-tier families receive free digital copy through underwriting</span></li>
            <li className="flex gap-2"><span className="text-[#B85838]">·</span><span><strong>Interactive companion</strong> — the books are paired with study paths inside the Spiritual Life module, making the app itself the natural complement to reading</span></li>
          </ul>
        </div>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Sponsorship & Advertising Ethics</div>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          PoeTech does not run programmatic advertising. We do not sell your data, share it with ad networks, or use behavioral targeting. Surveillance capitalism is the opposite of the stronghold this platform is meant to be.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>What we do allow:</strong> Curated editorial sponsorship — like public radio underwriting. Vetted partners, fully disclosed, no behavioral targeting, no third-party tracking. Shown only on the free Foundation tier as a way to fund the Community tiers. Paying tiers see no sponsorship content.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] mb-1 font-medium">Always allowed</div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>PoeTech upgrade prompts (internal)</span></li>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>Partner church & 501(c)(3) events</span></li>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>"PoeTech Picks" — vetted products + services we'd recommend to our own family</span></li>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>Educational sponsorships from credible institutions</span></li>
              <li className="flex gap-2"><span className="text-[#5A6E3D]">✓</span><span>Civic infrastructure (food banks, volunteer needs, community advocacy)</span></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] mb-1 font-medium">Never allowed</div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Behavioral targeting using your data</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Predatory financial products (payday loans, high-rate credit, sketchy investments)</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Programmatic / third-party ad networks</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Gambling, alcohol, tobacco, vice categories</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">✗</span><span>Anything PoeTech wouldn't recommend to its own family</span></li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          100% of sponsorship revenue funds the Community tier subscriptions. Transparent annual reporting: paying subscribers see what the underwriting funds. Sponsorship is part of the mission, not separate from it.
        </p>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Sponsor Tiers · Limited Slots</div>
        <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Maximum 5-7 active sponsors at a time. Limited slots keep the platform trustworthy and the placements valuable. This is the opposite of programmatic ad networks — less here is better.
        </p>
        <div className="space-y-3">
          <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Foundation Sponsor</h4>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>$25,000<span className="text-sm text-[#5A5751]">/yr</span></div>
            </div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Featured "Brought to you by..." placement on Foundation tier</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Prominent "PoeTech Picks" directory listing</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Sponsor of a specific module's free-tier content</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Quarterly newsletter co-branding</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Maximum 2 active Foundation Sponsors at any time</span></li>
            </ul>
            <button type="button" onClick={() => openCart({ name: 'Foundation Sponsor', tagline: 'Featured placement · max 2 active', monthly: '25000', annual: '25000', features: ['Featured "Brought to you by..." placement on Foundation tier','Prominent "PoeTech Picks" directory listing','Sponsor of a specific module\'s free-tier content','Quarterly newsletter co-branding'], isSponsor: true })} className="mt-3 w-full bg-[#B85838] text-white text-xs uppercase tracking-wider py-2 font-semibold hover:bg-[#1A1815]">Sponsor · Pay first, vet in parallel →</button>
          </div>
          <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Module Sponsor</h4>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>$10,000<span className="text-sm text-[#5A5751]">/yr</span></div>
            </div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Standard placement on Foundation tier</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Directory listing in "PoeTech Picks"</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Annual co-branded educational content</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Maximum 3 active Module Sponsors at any time</span></li>
            </ul>
            <button type="button" onClick={() => openCart({ name: 'Module Sponsor', tagline: 'Standard placement · max 3 active', monthly: '10000', annual: '10000', features: ['Standard placement on Foundation tier','Directory listing in "PoeTech Picks"','Annual co-branded educational content'], isSponsor: true })} className="mt-3 w-full bg-[#B85838] text-white text-xs uppercase tracking-wider py-2 font-semibold hover:bg-[#1A1815]">Sponsor · Pay first, vet in parallel →</button>
          </div>
          <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
              <h4 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Directory Partner</h4>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>$3,000<span className="text-sm text-[#5A5751]">/yr</span></div>
            </div>
            <ul className="text-xs space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>"PoeTech Picks" directory listing</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Annual mission-alignment review</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]">·</span><span>Maximum 5 active Directory Partners</span></li>
            </ul>
            <button type="button" onClick={() => openCart({ name: 'Directory Partner', tagline: 'Directory listing · max 5 active', monthly: '3000', annual: '3000', features: ['"PoeTech Picks" directory listing','Annual mission-alignment review'], isSponsor: true })} className="mt-3 w-full bg-[#B85838] text-white text-xs uppercase tracking-wider py-2 font-semibold hover:bg-[#1A1815]">Sponsor · Pay first, vet in parallel →</button>
          </div>
        </div>
        <div className="mt-4 p-3 bg-[#FAF8F4] border-l-2 border-[#5A6E3D]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-medium mb-0.5">Revenue allocation</div>
          <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
            At full sponsor roster (~$80K-$150K/yr) this funds 200-500 Community-tier subscriptions. Transparent annual report shows every dollar.
          </p>
        </div>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Vetting Framework · The PoeTech Standard</div>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          A potential sponsor must pass <strong>all eight criteria</strong>. Failing one means no. The decision committee (Darrell + Christina + trusted advisor) decides unanimously.
        </p>
        <div className="space-y-2 mb-4">
          {[
            { n: 1, title: 'Mission alignment', q: 'Does this company\'s mission align with stewardship, family stability, and dignity for the underserved?' },
            { n: 2, title: 'Business model integrity', q: 'How do they make money? Extractive economics (predatory lending dressed in good marketing) or genuine value creation?' },
            { n: 3, title: 'Customer treatment', q: 'BBB ratings · Google reviews · regulatory complaints · lawsuits · class actions.' },
            { n: 4, title: 'Yahweh-approves filter', q: 'No vice categories. Nothing PoeTech wouldn\'t recommend to its own family.' },
            { n: 5, title: 'Transparency', q: 'Clear pricing · clear terms of service · clear data practices · no buried fees.' },
            { n: 6, title: 'Regulatory compliance', q: 'Properly licensed and in good standing in every jurisdiction they operate.' },
            { n: 7, title: 'Ownership and leadership', q: 'Who actually owns and runs the company? Are they aligned, or is this a shell for someone else?' },
            { n: 8, title: 'Real conversation', q: 'Will their leadership get on a call and answer hard questions? If they won\'t, no.' },
          ].map(c => (
            <div key={c.n} className="flex gap-3 items-start">
              <div className="text-[#B85838] shrink-0 w-6 text-center" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{c.n}</div>
              <div>
                <div className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{c.title}</div>
                <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{c.q}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-[#E8E4DC]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-medium mb-2">Vetting workflow</div>
          <ol className="text-xs text-[#5A5751] space-y-1" style={{ fontFamily: '"Fraunces", serif' }}>
            <li>1. Application submitted (online form)</li>
            <li>2. Initial review · 1 week · desk research</li>
            <li>3. Deep vetting · 2-4 weeks · customer references, regulatory check, leadership call</li>
            <li>4. Decision committee · <strong>unanimous required</strong></li>
            <li>5. 12-month contract · termination clause if mission alignment lapses</li>
            <li>6. Annual re-vetting · quarterly customer feedback check</li>
          </ol>
        </div>
      </section>

      <section className="bg-white border-2 border-[#B85838] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">How Sponsorship Works · Pay First, Vet in Parallel</div>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Pick a tier above and click <strong>Sponsor</strong>. Payment authorizes the slot reservation; vetting against the 8-criterion framework runs in parallel and typically completes in <strong>15 business days</strong>. If your sponsorship doesn't clear vetting, <strong>full refund within 5 business days</strong> — no questions, no friction. This protects both sides: you get a fast yes/no, and we keep the platform trustworthy.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Read the 8-criterion framework above and the never-allowed list before sponsoring — if your business doesn't fit, the vetting will return your money. Saves everyone time.
        </p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Questions before paying? Email <strong>contact@poetech.us</strong> with your mission, business model, ownership, regulatory status, and which tier you're considering. We'll respond within 3 business days. Limited slots — current opening status published quarterly.
        </p>
      </section>

      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">The Integration Promise</div>
        <p className="text-sm leading-relaxed mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Every module shares data with every other. When the home module detects an HVAC failure, the financial module sees the incident in the cash flow. When the health module measures stress, the financial module shows correlation with pressure. When the spiritual module marks a fast week, the financial module sees the grocery spend pattern.
        </p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          One family. One picture. All the granular detail when you need it.
        </p>
      </section>

      {checkoutIntents.length > 0 && (
        <section className="bg-white border border-[#1A1815] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">🛒 Checkout Intents · {checkoutIntents.length}</div>
          <h3 className="text-xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Who's clicked Subscribe or Claim</h3>
          <div className="space-y-2">
            {checkoutIntents.slice().reverse().map(ci => (
              <div key={ci.id} className="border border-[#E8E4DC] p-3">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{ci.name} <span className="text-xs text-[#5A5751]">· {ci.email}</span></div>
                    <div className="text-xs text-[#5A5751] mt-0.5">
                      {ci.action === 'subscribe' ? 'Subscribe' : 'Claim'} · <strong>{ci.tierName}</strong> · {ci.billing === 'free' ? 'free' : `${ci.billing} ($${ci.price})`}
                    </div>
                    {ci.notes && <div className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{ci.notes}</div>}
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <div className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{new Date(ci.at).toLocaleDateString()}</div>
                    <button onClick={() => { if (confirm('Delete this checkout intent?')) deleteCheckoutIntent(ci.id); }} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Local-first capture. Email handshake is currently mailto - swap in a Stripe Payment Link in the cart drawer when ready.
          </p>
        </section>
      )}

      {cartTier && (
        <div className="fixed inset-0 z-50 bg-[#1A1815]/60 flex items-center justify-center p-4" onClick={closeCart}>
          <div className="bg-white border-2 border-[#1A1815] max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#1A1815] flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🛒 Checkout</div>
                <h2 className="text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{cartTier.name}</h2>
                <div className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{cartTier.tagline}</div>
              </div>
              <button onClick={closeCart} aria-label="Close" className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
            </div>

            <div className="p-5 space-y-4">
              {cartTier.isSponsor ? (
                <>
                  <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3">
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold">Annual sponsorship</div>
                      <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${(parseFloat(cartTier.annual) || 0).toLocaleString()}<span className="text-sm text-[#5A5751]">/yr</span></div>
                    </div>
                    <p className="text-xs leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>
                      <strong>Pay first, vet after.</strong> Vetting against the 8 PoeTech criteria runs in parallel — typically 15 business days. If your sponsorship doesn't pass vetting, <strong>full refund within 5 business days</strong>. Limited slots; placement begins after vetting clears.
                    </p>
                  </div>
                </>
              ) : cartTier.monthly !== '0' ? (
                <>
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setCartBilling('monthly')} className={`p-3 text-left border ${cartBilling === 'monthly' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                        <div className="text-[10px] uppercase tracking-wider opacity-75">Monthly</div>
                        <div className="text-xl mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${cartTier.monthly}<span className="text-xs opacity-75">/mo</span></div>
                      </button>
                      <button onClick={() => setCartBilling('annual')} className={`p-3 text-left border ${cartBilling === 'annual' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                        <div className="text-[10px] uppercase tracking-wider opacity-75">Annual · save ~17%</div>
                        <div className="text-xl mt-0.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${cartTier.annual}<span className="text-xs opacity-75">/yr</span></div>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between pt-3 border-t border-[#E8E4DC]">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Total today</div>
                    <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${cartBilling === 'annual' ? cartTier.annual : cartTier.monthly}<span className="text-sm text-[#5A5751]">{cartBilling === 'annual' ? '/yr' : '/mo'}</span></div>
                  </div>
                </>
              ) : (
                <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] font-semibold">Free tier · no payment required</div>
                  <p className="text-xs mt-1" style={{ fontFamily: '"Fraunces", serif' }}>We'll confirm your eligibility and send access details. No card needed.</p>
                </div>
              )}

              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Name *</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={cartName} onChange={e => setCartName(e.target.value)} placeholder="First Last" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Email *</label>
                <input type="email" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={cartEmail} onChange={e => setCartEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes (optional)</label>
                <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" value={cartNotes} onChange={e => setCartNotes(e.target.value)} placeholder="Anything you want us to know (referral, timing, family size, questions)" />
              </div>

              {cartError && <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{cartError}</div>}
              <button onClick={() => submitCart(cartTier.isSponsor ? 'sponsor' : cartTier.monthly === '0' ? 'claim' : 'subscribe')} className="w-full bg-[#1A1815] text-white py-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">
                {cartTier.isSponsor ? 'Sponsor · Pay now, vet in parallel' : cartTier.monthly === '0' ? 'Claim it · Send confirmation email' : 'Subscribe · Send confirmation email'}
              </button>
              <p className="text-[10px] text-[#5A5751] italic text-center" style={{ fontFamily: '"Fraunces", serif' }}>
                Opens your email client to finish the request. Logged locally in Checkout Intents below.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

