import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, Bar, BarChart } from 'recharts';

// =============================================================================
// SEED DATA — v7 adds events array
// =============================================================================
const SEED_DATA = {
  meta: { lastUpdated: '2026-05-16', monthOfData: 'May 2026', bufferTarget: 5000, bufferCurrent: 0, appVersion: '28.0', releaseLabel: 'MVP v1.4', releaseNote: 'Subtle sales banners on working pages · dashboard clean', moduleSlug: 'financial', taxStructure: { filing: 'joint-1040', scheduleC: ['e-tlc', 'e-poetech'], scheduleE: ['e-poeprops'], sCorpElected: [], withholdingCoversFederal: true, withholdingCoversState: true, state: 'IL', county: 'Champaign', propertyTaxEscrowed: true }},
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
    { id: 'k4', direction: 'inbound', entityId: 'e-poetech', name: 'Federal Companies', role: 'Network architecture consulting', ytdReceived: 0, monthlyExpected: 1500, status: 'pipeline' },
    { id: 'k5', direction: 'inbound', entityId: 'e-poetech', name: 'Other Church AV', role: 'AV consulting contracts', ytdReceived: 0, monthlyExpected: 800, status: 'pipeline' },
    { id: 'k6', direction: 'inbound', entityId: 'e-poetech', name: 'UIUC F&S (1099)', role: 'BAS / Siemens consulting', ytdReceived: 0, monthlyExpected: 1000, status: 'possible' },
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
  incidents: [
    { id: 'in1', date: '2026-05-01', amount: 300.00, category: 'vehicle', entityId: 'e-personal', description: 'Tatmans Towing' },
    { id: 'in3', date: '2026-05-06', amount: 500.00, category: 'property', entityId: 'e-poeprops', description: 'Animal Damage Control' },
    { id: 'in5', date: '2026-05-13', amount: 363.00, category: 'medical', entityId: 'e-personal', description: 'Robert W Shafer Orthodontics' },
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
      { id: 'r1', name: '1508 Williamsburg', rent: 1100, actual: 1100, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 88000, rate: 6.50, monthlyPI: 556, escrow: 180, estimated: true } },
      { id: 'r2', name: '1513 Holly Hill', rent: 1100, actual: 1100, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 88000, rate: 6.50, monthlyPI: 556, escrow: 180, estimated: true } },
      { id: 'r3', name: '1508 Holly Hill', rent: 1400, actual: 550, status: 'late', entityId: 'e-poeprops', mortgage: { balance: 110000, rate: 6.50, monthlyPI: 695, escrow: 220, estimated: true } },
      { id: 'r4', name: '805 Apt 1', rent: 850, actual: 850, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r5', name: '805 Apt 2', rent: 950, actual: 950, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r6', name: '805 Apt 3', rent: 900, actual: 900, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r7', name: '805 Apt 4', rent: 1000, actual: 1000, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 70000, rate: 6.50, monthlyPI: 442, escrow: 150, estimated: true } },
      { id: 'r8', name: '440 South Street', rent: 950, actual: 950, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 80000, rate: 6.50, monthlyPI: 506, escrow: 170, estimated: true } },
      { id: 'r9', name: '1003 Koehn', rent: 1250, actual: 1250, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 100000, rate: 6.50, monthlyPI: 632, escrow: 200, estimated: true } },
      { id: 'r10', name: '1213 Koehn', rent: 1200, actual: 1200, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 95000, rate: 6.50, monthlyPI: 600, escrow: 195, estimated: true } },
      { id: 'r11', name: '709 Commercial', rent: 1000, actual: 1000, status: 'paying', entityId: 'e-poeprops', mortgage: { balance: 80000, rate: 6.50, monthlyPI: 506, escrow: 170, estimated: true } },
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
  opportunities: [
    { id: 'o1', person: 'Family', skill: 'Property management', what: 'Self-manage 1508 Holly Hill turnover', monthly: 1400, hours: 0, status: 'Priority', flag: true },
    { id: 'o2', person: 'Family', skill: 'Rent collection', what: 'Recover 805 Apt 3 (or evict/re-rent)', monthly: 350, hours: 0, status: 'Priority', flag: true },
    { id: 'o3', person: 'Darrell', skill: 'Network / OT-IT', what: 'PoeTech client #1 (Federal Companies)', monthly: 1500, hours: 5, status: 'Pipeline' },
    { id: 'o4', person: 'Darrell', skill: 'PWA / React dev', what: 'PoeTech app dev contracts', monthly: 2000, hours: 8, status: 'Building' },
    { id: 'o5', person: 'Darrell', skill: 'BAS / Siemens', what: 'UIUC F&S consulting (1099)', monthly: 1000, hours: 4, status: 'Possible' },
    { id: 'o6', person: 'Darrell', skill: 'Church tech', what: 'Champaign churches AV consulting', monthly: 800, hours: 3, status: 'Pipeline' },
    { id: 'o7', person: 'Christina', skill: 'Therapy practice', what: 'Add 1-2 more MSW contractors', monthly: 2000, hours: 0, status: 'Decision' },
    { id: 'o8', person: 'Christina', skill: 'Guardianship', what: 'Speaking / training (community)', monthly: 500, hours: 2, status: 'Possible' },
    { id: 'o9', person: 'PoeTech Services', skill: 'Consulting + build', what: 'Warm Prospect A — has business + some tech background, interested', monthly: 2500, hours: 6, status: 'Active conversation', flag: true },
    { id: 'o10', person: 'PoeTech Services', skill: 'Consulting + build', what: 'Warm Prospect B — has idea + business background, interested', monthly: 2500, hours: 6, status: 'Active conversation', flag: true },
    { id: 'o11', person: 'PoeTech Services', skill: 'Revenue share build', what: 'Equity-split engagement on warm prospect business', monthly: 1500, hours: 8, status: 'Possible structure' },
    { id: 'o12', person: 'Family Educators', skill: 'K-12 teaching online', what: 'Principal Family Member A — online tutoring for homeschool families', monthly: 3000, hours: 10, status: 'Interested', flag: true },
    { id: 'o13', person: 'Family Educators', skill: 'K-12 teaching online', what: 'Principal Family Member B — online tutoring + curriculum support', monthly: 3000, hours: 10, status: 'Interested', flag: true },
    { id: 'o14', person: 'Family Educators', skill: 'Special-needs support', what: 'Specialized homeschool support for bullied / special-needs kids', monthly: 2000, hours: 8, status: 'Build', flag: true },
    { id: 'o15', person: 'PoeTech Services', skill: 'Elder care platform', what: 'Elder Care Coordination — adult children managing aging parents', monthly: 2500, hours: 6, status: 'Possible market' },
    { id: 'o16', person: 'PoeTech Services', skill: 'Caregiver marketplace', what: 'Elder Care 1099 caregiver platform — Care.com alternative', monthly: 4000, hours: 10, status: 'Vision · large market' },
    { id: 'o17', person: 'Poe Properties', skill: 'Ethical home acquisition', what: 'Home Legacy Program — purchase from elderly with no heirs (with attorney + integrity)', monthly: 0, hours: 4, status: 'Relationship building' },
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
const PROJECT_STATUSES = ['planning', 'active', 'ending-soon', 'complete', 'on-hold'];

// =============================================================================
// HELPERS
// =============================================================================
const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtCompact = (n) => { if (n == null || !isFinite(n)) return '—'; const a = Math.abs(n); if (a >= 1000000) return `${n < 0 ? '-' : ''}$${(a/1000000).toFixed(1)}M`; if (a >= 1000) return `${n < 0 ? '-' : ''}$${Math.round(a/1000)}k`; return `${n < 0 ? '-' : ''}$${Math.round(a)}`; };
const fmtPct = (n) => n == null ? '—' : `${n.toFixed(1)}%`;
const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(d, offset) { const x = new Date(d.getFullYear(), d.getMonth() + offset, 1); return `${MONTHS_ABBR[x.getMonth()]} '${String(x.getFullYear()).slice(2)}`; }
function yearsAndMonths(months) { const y = Math.floor(months / 12); const m = months % 12; if (y === 0) return `${m}mo`; if (m === 0) return `${y}yr`; return `${y}yr ${m}mo`; }
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
            incidents: Array.isArray(parsed.data.incidents) ? parsed.data.incidents : (d.incidents || []),
            recurringObligations: Array.isArray(parsed.data.recurringObligations) ? parsed.data.recurringObligations : (d.recurringObligations || []),
            scopes: Array.isArray(parsed.data.scopes) ? parsed.data.scopes : (d.scopes || []),
            practiceInquiries: Array.isArray(parsed.data.practiceInquiries) ? parsed.data.practiceInquiries : (d.practiceInquiries || []),
            inquiries: Array.isArray(parsed.data.inquiries) ? parsed.data.inquiries : (d.inquiries || []),
            checkoutIntents: Array.isArray(parsed.data.checkoutIntents) ? parsed.data.checkoutIntents : (d.checkoutIntents || []),
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
  const addIncident = (item) => setData(d => ({ ...d, incidents: [...d.incidents, { ...item, id: `in-${Date.now()}` }] }));
  const addEvent = (item) => setData(d => ({ ...d, events: [...(d.events || []), { ...item, id: `ev-${Date.now()}`, createdAt: new Date().toISOString(), completedAt: null }] }));
  const completeEvent = (id) => setData(d => ({ ...d, events: (d.events || []).map(e => e.id === id ? { ...e, completedAt: new Date().toISOString() } : e) }));
  const addProject = (item) => setData(d => ({ ...d, projects: [...(d.projects || []), { ...item, id: `pr-${Date.now()}`, createdAt: new Date().toISOString() }] }));
  const updateProject = (id, updates) => setData(d => ({ ...d, projects: (d.projects || []).map(p => p.id === id ? { ...p, ...updates } : p) }));
  const deleteProject = (id) => setData(d => ({ ...d, projects: (d.projects || []).filter(p => p.id !== id) }));
  const addSubscription = (item) => setData(d => ({ ...d, subscriptions: [...(d.subscriptions || []), { ...item, id: `sub-${Date.now()}`, createdAt: new Date().toISOString() }] }));
  const updateSubscription = (id, updates) => setData(d => ({ ...d, subscriptions: (d.subscriptions || []).map(s => s.id === id ? { ...s, ...updates } : s) }));
  const deleteSubscription = (id) => setData(d => ({ ...d, subscriptions: (d.subscriptions || []).filter(s => s.id !== id) }));
  const addFeedback = (item) => setData(d => ({ ...d, feedback: [...(d.feedback || []), { ...item, id: `fb-${Date.now()}`, createdAt: new Date().toISOString() }] }));
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

  const totals = useMemo(() => {
    const salaryActual = data.inflows.salaries.reduce((s, x) => s + x.actual, 0);
    const rentalActual = data.inflows.rentals.reduce((s, x) => s + x.actual, 0);
    const rentalExpected = data.inflows.rentals.reduce((s, x) => s + x.rent, 0);
    const rentGap = rentalExpected - rentalActual;
    const collectionRate = rentalExpected > 0 ? (rentalActual / rentalExpected) * 100 : 0;
    const totalInflow = salaryActual + rentalActual;
    const totalOutflow = Object.values(data.outflows).reduce((s, x) => s + x, 0);
    const netCashFlow = totalInflow - totalOutflow;
    const totalConsumerDebt = data.debts.filter(d => !d.leaveAlone).reduce((s, d) => s + d.balance, 0);
    const totalRentalDebt = data.inflows.rentals.reduce((s, r) => s + r.mortgage.balance, 0);
    const totalRentalPI = data.inflows.rentals.reduce((s, r) => s + r.mortgage.monthlyPI, 0);
    const totalOpportunity = data.opportunities.reduce((s, o) => s + o.monthly, 0);
    const totalOppHours = data.opportunities.reduce((s, o) => s + o.hours, 0);
    return { salaryActual, rentalActual, rentalExpected, rentGap, collectionRate, totalInflow, totalOutflow, netCashFlow, totalConsumerDebt, totalRentalDebt, totalRentalPI, totalOpportunity, totalOppHours };
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
  const rentalSnowball = useMemo(() => projectRentalSnowball(data.inflows.rentals, snowballExtra, snowballSort, currentDate, 240), [data.inflows.rentals, snowballExtra, snowballSort, currentDate]);
  const sevenYearTarget = useMemo(() => findExtraForTarget(data.inflows.rentals, 7, currentDate), [data.inflows.rentals, currentDate]);

  const entityRollups = useMemo(() => data.entities.map(entity => {
    const accounts = data.accounts.filter(a => a.entityId === entity.id);
    const balance = accounts.reduce((s, a) => s + a.balance, 0);
    const inflow = [...data.inflows.salaries.filter(s => s.entityId === entity.id).map(s => s.actual), ...data.inflows.rentals.filter(r => r.entityId === entity.id).map(r => r.actual)].reduce((s, x) => s + x, 0);
    const debts = data.debts.filter(d => d.entityId === entity.id);
    const debtBalance = debts.reduce((s, d) => s + d.balance, 0);
    return { entity, accounts, balance, inflow, debts, debtBalance };
  }), [data]);

  const flaggedRentals = data.inflows.rentals.filter((r) => r.status === 'late');
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
   THEME: WHITE (Editorial · default) — softened from pure cream
   Less bright, more grey-cream so it's easier on the eyes
   =================================================================== */
[data-theme="white"] .bg-\\[\\#FAF8F4\\]{background-color:#F2EFE8!important}
[data-theme="white"] .bg-\\[\\#E8E4DC\\]{background-color:#DFDAD0!important}
[data-theme="white"] .border-\\[\\#E8E4DC\\]{border-color:#DFDAD0!important}
[data-theme="white"] .bg-white{background-color:#F8F6F1!important}

/* ===================================================================
   THEME: SLATE — modern cool gray, distinct from default
   =================================================================== */
[data-theme="slate"] .bg-\\[\\#FAF8F4\\]{background-color:#F1F5F9!important}
[data-theme="slate"] .border-\\[\\#E8E4DC\\]{border-color:#CBD5E1!important}
[data-theme="slate"] .bg-\\[\\#E8E4DC\\]{background-color:#CBD5E1!important}
[data-theme="slate"] .text-\\[\\#1A1815\\]{color:#0F172A!important}
[data-theme="slate"] .text-\\[\\#5A5751\\]{color:#475569!important}
[data-theme="slate"] .border-\\[\\#1A1815\\]{border-color:#0F172A!important}
[data-theme="slate"] .bg-\\[\\#1A1815\\]{background-color:#0F172A!important}

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
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">PoeTech · Family OS</div>
              <h1 className="text-2xl sm:text-3xl leading-none truncate" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Financial Control System</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button onClick={() => setFeedbackOpen(true)} className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white font-semibold whitespace-nowrap">
                💬 Feedback
              </button>
              <div className="flex gap-1 items-center" role="group" aria-label="Theme selector">
                {[
                  { key: 'white', color: '#F2EFE8', border: '#1A1815' },
                  { key: 'slate', color: '#F1F5F9', border: '#0F172A' },
                  { key: 'sapphire', color: '#EFF6FF', border: '#1E3A8A' },
                  { key: 'rose', color: '#FDF2F8', border: '#831843' },
                  { key: 'midnight', color: '#000000', border: '#888888' },
                ].map(t => (
                  <button key={t.key} onClick={() => setTheme(t.key)} aria-label={`${t.key} theme`} title={t.key.charAt(0).toUpperCase() + t.key.slice(1)} className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all ${theme === t.key ? 'ring-2 ring-[#B85838] ring-offset-1 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`} style={{ backgroundColor: t.color, border: `1.5px solid ${t.border}` }}></button>
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
            <div className="flex gap-1 text-xs sm:text-sm">
              {[['overview','Big Picture'],['books','Books'],['debts','Debts'],['rentals','Rentals'],['projects','Projects'],['practice','Practice'],['opportunities','Opp'],['about','About']].map(([id, label]) => (
                <button key={id} onClick={() => setView(id)} className={`px-2.5 sm:px-3 py-2.5 whitespace-nowrap border-b-2 transition-colors ${view === id ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
              ))}
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
        {view === 'overview' && <BigPictureDashboard totals={totals} pressure={pressure} setPressure={setPressure} pressureCalc={pressureCalc} projection={projection} rentalSnowball={rentalSnowball} flaggedRentals={flaggedRentals} flaggedOpportunities={flaggedOpportunities} entityRollups={entityRollups} reserves={reserves} upcomingEvents={upcomingEvents} welcomeDismissed={data.welcomeDismissed} dismissWelcome={dismissWelcome} setView={setView} setFeedbackOpen={setFeedbackOpen} />}
        {view === 'books' && (
          <>
            {booksView === 'entities' && <BooksEntities entityRollups={entityRollups} entityFilter={entityFilter} setEntityFilter={setEntityFilter} data={data} />}
            {booksView === 'accounts' && <BooksAccounts entityRollups={entityRollups} entities={data.entities} addAccount={addAccount} updateAccount={updateAccount} deleteAccount={deleteAccount} />}
            {booksView === 'transactions' && <BooksTransactions data={data} entityFilter={entityFilter} setEntityFilter={setEntityFilter} currentDate={currentDate} addTransaction={addTransaction} updateTransaction={updateTransaction} deleteTransaction={deleteTransaction} />}
            {booksView === 'cart' && <Cart subscriptions={data.subscriptions || []} entities={data.entities} addSubscription={addSubscription} updateSubscription={updateSubscription} deleteSubscription={deleteSubscription} />}
            {booksView === 'k1099' && <ThousandNinetyNine contractors={data.contractors1099} />}
            {booksView === 'calendar' && <Calendar data={data} reserves={reserves} addRecurring={addRecurring} addIncident={addIncident} addEvent={addEvent} completeEvent={completeEvent} deleteRecurring={deleteRecurring} deleteIncident={deleteIncident} deleteEvent={deleteEvent} notifPermission={notifPermission} requestNotif={requestNotificationPermission} upcomingEvents={upcomingEvents} />}
          </>
        )}
        {view === 'debts' && <Debts debts={data.debts} entities={data.entities} debtSnowballSort={debtSnowballSort} setDebtSnowballSort={setDebtSnowballSort} debtSnowballExtra={debtSnowballExtra} setDebtSnowballExtra={setDebtSnowballExtra} debtSnowball={debtSnowball} debtMinOnly={debtMinOnly} currentDate={currentDate} />}
        {view === 'rentals' && <Rentals rentals={data.inflows.rentals} entities={data.entities} totals={totals} snowballSort={snowballSort} setSnowballSort={setSnowballSort} snowballExtra={snowballExtra} setSnowballExtra={setSnowballExtra} rentalSnowball={rentalSnowball} sevenYearTarget={sevenYearTarget} currentDate={currentDate} addRental={addRental} updateRental={updateRental} deleteRental={deleteRental} />}
        {view === 'projects' && <ProjectsWrapper projects={data.projects || []} scopes={data.scopes || []} entities={data.entities} contractors={data.contractors1099 || []} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} addScope={addScope} deleteScope={deleteScope} />}
        {view === 'practice' && <Practice inquiries={data.inquiries} contractors={data.contractors1099} addInquiry={addInquiry} updateInquiry={updateInquiry} deleteInquiry={deleteInquiry} />}
        {view === 'opportunities' && <Opportunities opportunities={data.opportunities} totals={totals} />}
        {view === 'about' && <About moduleInterest={data.moduleInterest || {}} toggleModuleInterest={toggleModuleInterest} theme={theme} setTheme={setTheme} feedback={data.feedback || []} deleteFeedback={deleteFeedback} checkoutIntents={data.checkoutIntents || []} addCheckoutIntent={addCheckoutIntent} deleteCheckoutIntent={deleteCheckoutIntent} />}

        <footer className="mt-16 pt-6 border-t border-[#E8E4DC] text-center print:hidden">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-2">PoeTech · A family data platform · {data.meta.releaseLabel || `v${data.meta.appVersion}`} · {data.meta.releaseNote || ''}</div>
          <button onClick={resetToSeed} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] underline underline-offset-4">Reset to seed data</button>
        </footer>
      </main>
      <TTSControls />
      <InstallPrompt />
      <UpdatePrompt />
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
            <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-[9px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">×</button>
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
          <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-[10px] uppercase tracking-wider opacity-70 hover:opacity-100">×</button>
        </div>
        <p className="text-xs leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          A fresh version of PoeTech downloaded in the background. Reload to use it — your data stays put.
        </p>
        <button onClick={reload} className="w-full bg-[#B85838] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#FAF8F4] hover:text-[#1A1815]">
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
          <button onClick={dismiss} aria-label="Dismiss install prompt" className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">×</button>
        </div>
        {deferredEvt ? (
          <>
            <p className="text-xs leading-snug mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Add PoeTech to your home screen so you can open it like a regular app — works offline, no browser bar, faster launch.
            </p>
            <button onClick={installAndroid} className="w-full bg-[#1A1815] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">
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
  const [rate, setRate] = useState(1.0);
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
            <button onClick={() => { stopReading(); setIsOpen(false); }} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-3">
            {!isReading ? (
              <button onClick={startReading} className="col-span-3 bg-[#1A1815] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">▶ Read this page</button>
            ) : (
              <>
                <button onClick={togglePause} className="bg-[#1A1815] text-white px-2 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">{isPaused ? '▶ Resume' : '⏸ Pause'}</button>
                <button onClick={stopReading} className="col-span-2 border border-[#1A1815] text-[#1A1815] px-2 py-2 text-xs uppercase tracking-wider hover:bg-[#1A1815] hover:text-white">⏹ Stop</button>
              </>
            )}
          </div>
          <div className="mb-2">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Speed: {rate.toFixed(1)}x</div>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Slow', value: 0.7 },
                { label: 'Normal', value: 1.0 },
                { label: 'Fast', value: 1.3 },
                { label: 'Faster', value: 1.5 },
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
        <button onClick={() => setIsOpen(true)} aria-label="Open text-to-speech controls" title="Read aloud" className="bg-[#1A1815] text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-[#B85838] flex items-center justify-center text-xl sm:text-2xl border-2 border-[#FAF8F4]">
          🔊
        </button>
      )}
    </div>
  );
}

function FeedbackModal({ onClose, onSubmit, currentView }) {
  const [rating, setRating] = useState('');
  const [area, setArea] = useState(currentView || 'overview');
  const [whatsWorking, setWhatsWorking] = useState('');
  const [whatsNot, setWhatsNot] = useState('');
  const [whatsMissing, setWhatsMissing] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = () => {
    if (!rating && !whatsWorking && !whatsNot && !whatsMissing) {
      setFormError('Please share at least one note — anything is helpful.');
      return;
    }
    onSubmit({ rating, area, whatsWorking, whatsNot, whatsMissing });
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
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">💬 Feedback · MVP Test</div>
              <h3 className="text-xl sm:text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Tell us what you think.</h3>
            </div>
            <button onClick={onClose} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Close</button>
          </div>
          <p className="text-sm text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
            Anything you share helps. Skip any section — partial feedback is more useful than no feedback.
          </p>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 font-semibold">Overall feeling</div>
              <div className="grid grid-cols-5 gap-1">
                {ratings.map(r => (
                  <button key={r.key} onClick={() => setRating(r.key)} className={`p-2 text-xs border ${rating === r.key ? 'border-[#1A1815] bg-[#FAF8F4]' : 'border-[#E8E4DC] text-[#5A5751]'}`} style={rating === r.key ? { color: r.color, fontWeight: 600 } : {}}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Which area?</div>
              <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={area} onChange={e => setArea(e.target.value)}>
                <option value="overview">Big Picture / Overview</option>
                <option value="books">Books / Transactions / Cart</option>
                <option value="debts">Debts / Snowball</option>
                <option value="rentals">Rentals / Snowball</option>
                <option value="projects">Projects / Timeline</option>
                <option value="scopes">Scopes / Contracts</option>
                <option value="practice">Practice / TLC</option>
                <option value="opportunities">Opportunities</option>
                <option value="about">About / Modules</option>
                <option value="navigation">Navigation / Overall UX</option>
                <option value="design">Visual Design / Themes</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] mb-1 font-semibold">✓ What's working</div>
              <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="What feels right? What helps you?" value={whatsWorking} onChange={e => setWhatsWorking(e.target.value)} />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">✗ What's not working</div>
              <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Confusion · bugs · friction · unclear text · too much · too little" value={whatsNot} onChange={e => setWhatsNot(e.target.value)} />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">+ What's missing</div>
              <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Features you wish existed · workflows that don't fit · what would make this perfect for you" value={whatsMissing} onChange={e => setWhatsMissing(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 mt-5 pt-4 border-t border-[#E8E4DC]">
            {formError && <div className="text-xs text-[#B85838] mb-2 px-3 py-2 bg-[#FAF8F4] border border-[#B85838] w-full" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{formError}</div>}
            <button onClick={handleSubmit} className="bg-[#1A1815] text-[#FAF8F4] px-6 py-2.5 text-xs uppercase tracking-wider hover:bg-[#B85838] font-semibold">Submit Feedback</button>
            <button onClick={onClose} className="border border-[#E8E4DC] text-[#5A5751] px-6 py-2.5 text-xs uppercase tracking-wider hover:border-[#1A1815]">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// BIG PICTURE — v7 dashboard horizontal-first
// =============================================================================
function BigPictureDashboard({ totals, pressure, setPressure, pressureCalc, projection, rentalSnowball, flaggedRentals, flaggedOpportunities, entityRollups, reserves, upcomingEvents, welcomeDismissed, dismissWelcome, setView, setFeedbackOpen }) {
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
            <button onClick={dismissWelcome} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] shrink-0">× Dismiss</button>
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
              <strong>When something works, doesn't work, or could be better — tap <button onClick={() => setFeedbackOpen(true)} className="text-[#B85838] underline font-semibold hover:text-[#1A1815]">💬 Feedback</button> in the header.</strong> We'll review your notes together. This is your home base — make it yours.
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <button onClick={dismissWelcome} className="bg-[#1A1815] text-[#FAF8F4] px-5 py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Got it · Let's go</button>
              <button onClick={() => setFeedbackOpen(true)} className="border border-[#B85838] text-[#B85838] px-5 py-2 text-xs uppercase tracking-wider hover:bg-[#B85838] hover:text-white">Leave first impression</button>
            </div>
          </div>
        </section>
      )}

      {/* ADVISEMENT BANNER — Foundation tier · COLG + TLC + family businesses */}
      <AdvisementBanner />

      {/* HERO ROW — FORCED HORIZONTAL ON MOBILE */}
      <section className="grid grid-cols-3 gap-2 sm:gap-4">
        <CompactHero label="Net cash flow" value={`${totals.netCashFlow >= 0 ? '+' : ''}${fmtCompact(totals.netCashFlow)}`} sub="per mo · all entities" accent={totals.netCashFlow >= 0 ? 'green' : 'rust'} />
        <CompactHero label="Consumer debt free" value={projection.debtFreeDate} sub={`${projection.debtFreeYears.toFixed(1)}yr · pressure ${pressure}`} />
        <CompactHero label="Rentals owned free" value={rentalSnowball.allClearedDate} sub={`${rentalSnowball.allClearedYears.toFixed(1)}yr · snowball`} />
      </section>

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
            <button onClick={() => setShowForm(!showForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add subscription'}</button>
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
            <button onClick={submitSub} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Save Subscription</button>
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
                  <button onClick={() => { if (confirm('Delete this subscription record?')) deleteSubscription(s.id); }} className="text-[10px] px-2 py-1 text-[#5A5751] hover:text-[#B85838] uppercase tracking-wider">Delete</button>
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
// PROJECTS · TIMELINE · WORKLOAD COORDINATION — v17
// Multi-domain project tracking with start/end dates and workload visualization
// =============================================================================
// v21: ProjectsWrapper — sub-nav between Projects list and Scopes
function ProjectsWrapper({ projects, scopes, entities, contractors = [], addProject, updateProject, deleteProject, addScope, deleteScope }) {
  const [subView, setSubView] = useState('list');
  return (
    <div className="space-y-4">
      <div className="border-b border-[#E8E4DC]">
        <div className="flex gap-1 text-xs">
          {[['list','Projects · Timeline'],['scopes','Scopes · Agreements']].map(([id, label]) => (
            <button key={id} onClick={() => setSubView(id)} className={`px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${subView === id ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
          ))}
        </div>
      </div>
      {subView === 'list' && <Projects projects={projects} entities={entities} contractors={contractors} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} />}
      {subView === 'scopes' && <Scope scopes={scopes} projects={projects} entities={entities} addScope={addScope} deleteScope={deleteScope} />}
    </div>
  );
}

function Projects({ projects, entities, contractors = [], addProject, updateProject, deleteProject }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [projError, setProjError] = useState('');
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
    setShowForm(true);
  };

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
            <button onClick={() => { setEditingId(null); setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] }); setShowForm(!showForm); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add project'}</button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">{editingId ? 'Edit project' : 'New project'}</div>
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
            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Description · key milestones · who's involved" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
            {projError && <div className="text-xs text-[#B85838] mb-2 px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{projError}</div>}
            <button onClick={submitProject} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Project'}</button>
          </div>
        )}

        {filtered.length === 0 && !showForm && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
              No projects yet. Add the things you're working on across your life — work, family, ministry, side projects, repairs. The first ones often feel obvious; the value comes when you can see them all together.
            </p>
            <button onClick={() => {
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
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                    <h4 className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{p.title}</h4>
                    <div className="flex gap-2 items-center text-[10px] uppercase tracking-wider">
                      <span style={{ color: statusColor(p.status) }} className="font-medium">{p.status}</span>
                      <button onClick={() => startEdit(p)} className="text-[#5A5751] hover:text-[#B85838]">edit</button>
                      <button onClick={() => { if (confirm('Delete this project?')) deleteProject(p.id); }} className="text-[#5A5751] hover:text-[#B85838]">delete</button>
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
          <button onClick={() => setShowRecurForm(!showRecurForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showRecurForm ? '× Cancel' : '+ Add'}</button>
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
            <button onClick={submitRecur} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider">Add</button>
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
                  <button onClick={() => deleteRecurring(r.id)} className="text-[#5A5751] hover:text-[#B85838] text-xs">×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815]">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Incident Log</h2>
          <button onClick={() => setShowIncidentForm(!showIncidentForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showIncidentForm ? '× Cancel' : '+ Log'}</button>
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
            <button onClick={submitIncident} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider">Log</button>
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
                  <button onClick={() => deleteIncident(inc.id)} className="text-[#5A5751] hover:text-[#B85838] text-xs">×</button>
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
              <button onClick={requestNotif} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">🔔 Enable notifications</button>
            )}
            {notifPermission === 'granted' && (
              <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D]">🔔 Notifications on</span>
            )}
            {notifPermission === 'denied' && (
              <span className="text-[10px] uppercase tracking-wider text-[#B85838]">🔔 Blocked in browser</span>
            )}
            <button onClick={() => setShowEventForm(!showEventForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showEventForm ? '× Cancel' : '+ Add event'}</button>
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
            <button onClick={submitEvent} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Save Event</button>
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
                    <button onClick={() => completeEvent(e.id)} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">✓ Done</button>
                    <button onClick={() => deleteEvent(e.id)} className="text-[#5A5751] hover:text-[#B85838] text-xs">×</button>
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
        <button onClick={onCancel} className="text-[10px] uppercase tracking-wider text-[#5A5751]">× Cancel</button>
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
      <FormField label="Payment terms"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.paymentTerms || ''} onChange={update('paymentTerms')} /></FormField>
      <FormField label="Acceptance criteria"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.acceptanceCriteria || ''} onChange={update('acceptanceCriteria')} /></FormField>
      <FormField label="Requirements"><textarea rows="3" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.requirements || ''} onChange={update('requirements')} /></FormField>
      <FormField label="Warranty"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.warranty || ''} onChange={update('warranty')} /></FormField>
      <FormField label="Termination"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.terminationClause || ''} onChange={update('terminationClause')} /></FormField>
      <div className="flex gap-2 pt-3 border-t border-[#1A1815]">
        <button onClick={onSave} className="bg-[#1A1815] text-[#FAF8F4] px-6 py-2.5 text-xs uppercase tracking-wider">Save</button>
        <button onClick={onCancel} className="border border-[#1A1815] px-6 py-2.5 text-xs uppercase tracking-wider">Cancel</button>
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
        <button onClick={onBack} className="text-[10px] uppercase tracking-wider">← Back</button>
        <div className="flex gap-3"><button onClick={() => window.print()} className="text-[10px] uppercase tracking-wider text-[#B85838]">⎙ Print</button><button onClick={onDelete} className="text-[10px] uppercase tracking-wider">× Delete</button></div>
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
function Rentals({ rentals, entities, totals, snowballSort, setSnowballSort, snowballExtra, setSnowballExtra, rentalSnowball, sevenYearTarget, currentDate, addRental, updateRental, deleteRental }) {
  const rentalsWithCleared = rentals.map(r => { const cleared = rentalSnowball.activeProperties.find(p => p.id === r.id); return { ...r, clearedAtMonth: cleared?.clearedAtMonth }; });
  const orderedByPayoff = rentalsWithCleared.filter(r => r.clearedAtMonth).sort((a, b) => a.clearedAtMonth - b.clearedAtMonth);
  const sevenYrFeasible = rentalSnowball.allClearedYears <= 7;
  const gapMonthly = sevenYearTarget - snowballExtra;
  // v28+ Rentals expansion: add/edit property + autocomplete + map + evaluator
  const [showPropForm, setShowPropForm] = useState(false);
  const [editingPropId, setEditingPropId] = useState(null);
  const blankProp = () => ({ name: '', address: '', city: '', state: '', zip: '', lat: null, lon: null, propertyType: 'single-family', rent: 0, status: 'paying', entityId: 'e-poeprops', purchasePrice: 0, purchaseDate: '', estimatedValue: 0, mortgageBalance: 0, mortgageRate: 6.5, monthlyPI: 0, escrow: 0, notes: '' });
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

  const startAddProp = () => { setPropForm(blankProp()); setEditingPropId(null); setShowPropForm(true); setSuggestions([]); };
  const startEditProp = (r) => {
    setPropForm({
      name: r.name || '', address: r.address || '', city: r.city || '', state: r.state || '', zip: r.zip || '',
      lat: r.lat ?? null, lon: r.lon ?? null,
      propertyType: r.propertyType || 'single-family',
      rent: r.rent || 0, status: r.status || 'paying', entityId: r.entityId || 'e-poeprops',
      purchasePrice: r.purchasePrice || 0, purchaseDate: r.purchaseDate || '', estimatedValue: r.estimatedValue || 0,
      mortgageBalance: r.mortgage?.balance || 0, mortgageRate: r.mortgage?.rate || 6.5,
      monthlyPI: r.mortgage?.monthlyPI || 0, escrow: r.mortgage?.escrow || 0,
      notes: r.notes || '',
    });
    setEditingPropId(r.id); setShowPropForm(true); setSuggestions([]);
  };
  const cancelPropForm = () => { setShowPropForm(false); setEditingPropId(null); setSuggestions([]); };

  const submitProp = () => {
    if (!propForm.name || !propForm.address) { alert('Property name and address are required.'); return; }
    const payload = {
      name: propForm.name,
      address: propForm.address, city: propForm.city, state: propForm.state, zip: propForm.zip,
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
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Properties · {rentals.length}</h2>
          <button onClick={() => showPropForm ? cancelPropForm() : startAddProp()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showPropForm ? '× Cancel' : '+ Add property'}</button>
        </div>

        {showPropForm && (
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Property type</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.propertyType} onChange={e => setPropForm({ ...propForm, propertyType: e.target.value })}>
                  {['single-family','multi-family','commercial','condo','townhouse','duplex','other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly rent</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.rent} onChange={e => setPropForm({ ...propForm, rent: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.status} onChange={e => setPropForm({ ...propForm, status: e.target.value })}>
                  {['paying','late','vacant','rehab','for-sale','sold'].map(t => <option key={t} value={t}>{t}</option>)}
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

            <button onClick={submitProp} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingPropId ? 'Save Changes' : 'Save Property'}</button>
          </div>
        )}

        {rentals.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No properties yet. Use + Add property above.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {rentals.map((r, i) => (
              <div key={r.id} className={`p-4 ${i < rentals.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.name}</div>
                    <div className="text-xs text-[#5A5751]">
                      {[r.address, r.city, r.state, r.zip].filter(Boolean).join(', ') || 'no address yet'}
                      {r.propertyType && <span className="ml-2 uppercase tracking-wider text-[9px]">· {r.propertyType}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(r.rent)}<span className="text-xs text-[#5A5751]">/mo</span></div>
                    <div className={`text-[10px] uppercase tracking-wider ${r.status === 'late' ? 'text-[#B85838]' : r.status === 'vacant' ? 'text-[#B85838]' : 'text-[#5A5751]'}`}>{r.status}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                  <div><span className="text-[#5A5751]">Mortgage:</span> <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.mortgage?.balance ? fmt(r.mortgage.balance) : 'paid off'}</span></div>
                  <div><span className="text-[#5A5751]">Rate:</span> <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.mortgage?.rate ? r.mortgage.rate + '%' : '—'}</span></div>
                  <div><span className="text-[#5A5751]">P&I:</span> <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.mortgage?.monthlyPI ? fmt(r.mortgage.monthlyPI) : '—'}</span></div>
                  <div><span className="text-[#5A5751]">Coords:</span> {typeof r.lat === 'number' ? <span className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.lat.toFixed(3)}, {r.lon.toFixed(3)}</span> : <button onClick={() => startEditProp(r)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline">📍 Set address</button>}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => startEditProp(r)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Edit</button>
                  <button onClick={() => confirmDeleteProp(r)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838]">Delete</button>
                </div>
                {r.notes && <p className="text-[11px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{r.notes}</p>}
              </div>
            ))}
          </div>
        )}
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

function BooksEntities({ entityRollups, entityFilter, setEntityFilter, data }) {
  const visible = entityFilter === 'all' ? entityRollups : entityRollups.filter(r => r.entity.id === entityFilter);
  return (
    <div className="space-y-6">
      <section><SectionTitle>Entities</SectionTitle><div className="flex gap-1 flex-wrap text-xs"><button onClick={() => setEntityFilter('all')} className={`px-3 py-1.5 border ${entityFilter === 'all' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>All</button>{data.entities.map(e => <button key={e.id} onClick={() => setEntityFilter(e.id)} className={`px-3 py-1.5 border ${entityFilter === e.id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{e.name.split('(')[0].trim()}</button>)}</div></section>
      {visible.map((r) => (
        <section key={r.entity.id} className="bg-white border border-[#1A1815] p-5">
          <h3 className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.entity.name}</h3>
          <div className="text-xs text-[#5A5751] mt-0.5 mb-3">{r.entity.notes}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Cash" value={fmt(r.balance)} small accent={r.balance < 0 ? 'rust' : 'green'} />
            <MetricCell label="Inflow" value={fmt(r.inflow)} small />
            <MetricCell label="Debt" value={fmt(r.debtBalance)} small accent={r.debtBalance > 0 ? 'rust' : null} />
            <MetricCell label="Accounts" value={`${r.accounts.length}`} small />
          </div>
        </section>
      ))}
    </div>
  );
}

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'loan', 'investment', 'cash', 'other'];

function BooksAccounts({ entityRollups, entities, addAccount, updateAccount, deleteAccount }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const blank = { name: '', institution: '', type: 'checking', fragment: '', balance: 0, entityId: entities[0]?.id || 'e-personal', notes: '', isPrimary: false };
  const [form, setForm] = useState(blank);

  const startAdd = () => { setForm(blank); setEditingId(null); setShowForm(true); };
  const startEdit = (a) => { setForm({ name: a.name, institution: a.institution, type: a.type, fragment: a.fragment || '', balance: a.balance, entityId: a.entityId, notes: a.notes || '', isPrimary: !!a.isPrimary }); setEditingId(a.id); setShowForm(true); };
  const cancel = () => { setShowForm(false); setEditingId(null); setForm(blank); };
  const submit = () => {
    if (!form.name || !form.institution) { alert('Account name and institution are required.'); return; }
    if (editingId) updateAccount(editingId, form);
    else addAccount(form);
    cancel();
  };
  const confirmDelete = (a) => { if (confirm(`Delete account "${a.name}"? Transactions referencing it will keep the original accountId reference but will no longer roll up to an entity.`)) deleteAccount(a.id); };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Accounts · Add · Edit · Delete</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Every account, every entity, every balance.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Add the checking, savings, credit, and loan accounts that hold the household's cash flow. Each account belongs to an entity (Personal, Poe Properties, PoeTech, TLC). Balances feed every rollup, projection, and the funds-available check on upcoming transactions.
        </p>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Accounts</h2>
          <button onClick={() => showForm ? cancel() : startAdd()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add account'}</button>
        </div>

        {showForm && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">{editingId ? 'Edit account' : 'New account'}</div>
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
            <button onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Account'}</button>
          </div>
        )}
      </section>

      {entityRollups.map(r => (
        <section key={r.entity.id}>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">{r.entity.name.split('(')[0].trim()}</h3>
          {r.accounts.length === 0 ? (
            <div className="bg-white border border-[#E8E4DC] p-4 text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No accounts yet for this entity. Use + Add account above.</div>
          ) : (
            <div className="bg-white border border-[#1A1815]">
              {r.accounts.map((a, i) => (
                <div key={a.id} className={`p-3 ${i < r.accounts.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                  <div className="flex justify-between items-baseline gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{a.name}</span>
                      <span className="text-xs text-[#5A5751] ml-2">{a.institution} {a.fragment}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#5A5751] ml-2">{a.type}</span>
                      {a.isPrimary && <span className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold ml-2">★ primary</span>}
                    </div>
                    <div className={`text-right ${a.balance < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(a.balance)}</div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => startEdit(a)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">Edit</button>
                    <button onClick={() => confirmDelete(a)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838]">Delete</button>
                  </div>
                  {a.notes && <p className="text-xs text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{a.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

const TX_CATEGORIES = ['salary', 'rental-income', 'transfer', 'groceries', 'fuel', 'utilities', 'dining', 'medical', 'vehicle', 'household', 'charitable', 'business', 'professional', 'insurance', 'subscription', 'debt-payment', 'other'];

function BooksTransactions({ data, entityFilter, setEntityFilter, currentDate, addTransaction, updateTransaction, deleteTransaction }) {
  const [txView, setTxView] = useState('history');
  const [page, setPage] = useState(0);
  const pageSize = 25;
  useEffect(() => { setPage(0); }, [txView, entityFilter]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const todayISO = currentDate.toISOString().slice(0, 10);
  const blank = { date: todayISO, accountId: data.accounts[0]?.id || '', amount: 0, description: '', category: 'other', entityOverride: '' };
  const [form, setForm] = useState(blank);

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
          {afterBal !== null && (
            <div className={`text-[10px] mt-0.5 ${afterBal < 0 ? 'text-[#B85838] font-semibold' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {afterBal < 0 ? '⚠ ' : '→ '}After this hits: {fmt(afterBal)}
            </div>
          )}
        </td>
        <td className={`p-2 text-right whitespace-nowrap ${t.amount < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.amount > 0 ? '+' : ''}{fmt(t.amount)}</td>
        <td className="p-2 text-right whitespace-nowrap">
          {t._source !== 'recurring' && (
            <>
              <button onClick={() => startEdit(t)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] mr-2">Edit</button>
              <button onClick={() => confirmDelete(t)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838]">Delete</button>
            </>
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
            <button onClick={() => setEntityFilter('all')} className={`px-3 py-1.5 border ${entityFilter === 'all' ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>All</button>
            {data.entities.map(e => <button key={e.id} onClick={() => setEntityFilter(e.id)} className={`px-3 py-1.5 border ${entityFilter === e.id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{e.name.split('(')[0].trim()}</button>)}
          </div>
          <button onClick={() => showForm ? cancel() : startAdd()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add transaction'}</button>
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
            <button onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Transaction'}</button>
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
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="text-[10px] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1815]">« Previous</button>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#5A5751]">
                    <span>Page</span>
                    <select value={safePage} onChange={e => setPage(parseInt(e.target.value, 10))} className="p-1 border border-[#E8E4DC] text-xs bg-[#FAF8F4]">
                      {Array.from({ length: totalPages }).map((_, i) => <option key={i} value={i}>{i + 1}</option>)}
                    </select>
                    <span>of {totalPages} · showing {startIdx + 1}–{Math.min(startIdx + pageSize, list.length)} of {list.length}</span>
                  </div>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="text-[10px] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1A1815]">Next »</button>
                </div>
              )}
            </>
          );
        })()}
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

function Debts({ debts, entities, debtSnowballSort, setDebtSnowballSort, debtSnowballExtra, setDebtSnowballExtra, debtSnowball, debtMinOnly, currentDate }) {
  const sorted = [...debts].sort((a, b) => { if (a.leaveAlone !== b.leaveAlone) return a.leaveAlone ? 1 : -1; return b.rate - a.rate; });
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
            <input type="range" min="0" max="5000" step="50" value={debtSnowballExtra} onChange={(e) => setDebtSnowballExtra(parseInt(e.target.value))} className="w-full accent-[#B85838]" />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-[#5A5751] mt-1">
              <span>$0</span><span>$2,500</span><span>$5,000</span>
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

      {/* Original debt table */}
      <section>
        <SectionTitle>All Debts · By Rate</SectionTitle>
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

function Opportunities({ opportunities, totals }) {
  const grouped = opportunities.reduce((acc, o) => { (acc[o.person] = acc[o.person] || []).push(o); return acc; }, {});
  return (
    <div className="space-y-8">
      <PoeTechProjections />
      <PoeTechDifferentiation />
      <PoeTechServicesPortfolio />
      <LowHangingFruit />
      <section>
        <SectionTitle eyebrow="Pipeline">Near-Term Opportunities · Active This Year</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          The income streams available this month and across the year. Each one compounds into the bigger PoeTech business projection above. Active conversations get priority.
        </p>
      </section>
      {Object.entries(grouped).map(([person, items]) => (<section key={person}><h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">{person}</h3><div className="bg-white border border-[#1A1815]">{items.map((o, i) => (<div key={o.id} className={`p-4 ${i < items.length - 1 ? 'border-b border-[#E8E4DC]' : ''} ${o.flag ? 'bg-[#FAF8F4]' : ''}`}><div className="flex justify-between gap-3"><div className="flex-1 min-w-0"><div className="flex items-baseline gap-2 flex-wrap"><span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{o.what}</span>{o.flag && <span className="text-[10px] uppercase tracking-wider text-[#B85838] font-medium">⚠ Priority</span>}</div><div className="text-xs text-[#5A5751]">{o.skill} · {o.status}</div></div><div className="text-right shrink-0"><div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(o.monthly)}</div><div className="text-[10px] uppercase tracking-wider text-[#5A5751]">/ mo</div></div></div></div>))}</div></section>))}
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
      tagline: 'For big businesses tired of $5M, 5-year engagements. Pay us what the work is worth — not what BigCo bills.',
      pricing: '$50K–$500K projects · $25K–$75K/mo retainers · $400–$800/hr senior rate',
      best: 'For mid-large companies who need major build, integration, or transformation work — where compressed delivery and senior depth matter more than headcount. Premium pricing reflects compressed time AND saving you from a relationship with money-pit consulting firms.',
      includes: ['Senior architect on every call · no junior delegation','Compressed delivery — 6 months where BigCo quotes 18+','Modern stack expertise (not legacy Java/SOAP shops)','Direct executive relationship · no account-management layer','Outcome-based scoping — fixed milestones, not endless billable hours','Knowledge transfer · your team owns it after handoff'],
      forWho: 'CTOs, CIOs, COOs frustrated with $5M consulting bills that ship $500K of value over five years. We do the inverse: deliver $5M of value for $500K in nine months. Pay us for the team of 45 we deliver — not the $5M over 5 years a BigCo would charge for less. Pricing is fair because it reflects what we actually save you, in time and in dollars.',
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
              Premium pricing for compressed delivery. $50K–$500K projects. $25K–$75K/mo retainers. $400–$800/hr senior rates. Pay us for the team of 45 we deliver — not the $5M over 5 years a BigCo would charge for less.
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
            <button onClick={() => setShowForm(!showForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Log inquiry'}</button>
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
                  <option value="yes">Yes</option><option value="no">No / private pay</option><option value="unsure">Unsure</option>
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

            <button onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Log Inquiry</button>
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
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] uppercase tracking-wider text-[#5A5751]">{expanded ? '× Close' : 'Details'}</button>
          <button onClick={() => { if (confirm('Delete this inquiry?')) deleteInquiry(inq.id); }} className="text-[#5A5751] hover:text-[#B85838] text-xs">×</button>
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
              <div className="text-[10px] text-[#5A5751]">Insurance: {inq.hasInsurance}</div>
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

function About({ moduleInterest, toggleModuleInterest, theme, setTheme, feedback = [], deleteFeedback, checkoutIntents = [], addCheckoutIntent, deleteCheckoutIntent }) {
  // v28+ Session C: checkout cart drawer state
  const [cartTier, setCartTier] = useState(null);
  const [cartBilling, setCartBilling] = useState('monthly');
  const [cartName, setCartName] = useState('');
  const [cartEmail, setCartEmail] = useState('');
  const [cartNotes, setCartNotes] = useState('');
  const openCart = (tier) => { setCartTier(tier); setCartBilling('monthly'); setCartName(''); setCartEmail(''); setCartNotes(''); };
  const closeCart = () => setCartTier(null);
  const submitCart = (action) => {
    if (!cartTier) return;
    if (!cartName || !cartEmail) { alert('Name and email are required so we can follow up.'); return; }
    const isFree = cartTier.monthly === '0';
    const price = cartBilling === 'annual' ? cartTier.annual : cartTier.monthly;
    addCheckoutIntent({
      tierName: cartTier.name,
      tierTagline: cartTier.tagline,
      billing: isFree ? 'free' : cartBilling,
      price: isFree ? 0 : parseFloat(price) || 0,
      name: cartName,
      email: cartEmail,
      notes: cartNotes,
      action, // 'subscribe' | 'claim'
      status: 'new',
    });
    // Open mailto so user can complete the handshake via email until Stripe is wired in
    const subject = isFree ? `Claim: ${cartTier.name}` : `Subscribe: ${cartTier.name} (${cartBilling})`;
    const body = `Name: ${cartName}\nEmail: ${cartEmail}\nTier: ${cartTier.name}\n${isFree ? 'Free tier - claiming access' : `Billing: ${cartBilling} ($${price})`}\n\nNotes:\n${cartNotes || '(none)'}`;
    const url = `mailto:contact@poetech.us?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try { window.location.href = url; } catch (e) {}
    closeCart();
  };
  return (
    <div className="space-y-10 max-w-prose">
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
                    <button onClick={() => { if (confirm('Delete this feedback?')) deleteFeedback(f.id); }} className="text-[9px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838]">×</button>
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
        <h2 className="text-3xl sm:text-4xl mb-4 leading-tight" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>A stronghold for relationship with Yahweh.</h2>
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
          <ModuleCard moduleKey="elder-marketplace" status="vision" title="Elder Care · 1099 Caregiver Marketplace" desc="The mission-aligned alternative to Care.com. Local 1099 caregivers earn fair pay doing the work elderly neighbors need — light housekeeping, meal prep, transportation, companionship, medication reminders, tech help. Communities serve their elderly. Workers earn meaningfully. Platform takes a fair fee, not extractive." features={['Vetted caregiver marketplace · background-checked','Family-coordinated booking (adult children manage, multiple workers)','Standard split: 85% to caregiver · 15% to PoeTech (lower than Care.com)','Scope-of-work agreements built into every engagement','Recurring schedule support (weekly grocery runs, daily check-ins)','Subsidized rates for Community-tier elderly through underwriting','Reverse-marketplace: elderly post needs, vetted caregivers respond','Integration with Elder Care Coordination for families managing care']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="home-legacy" status="vision" title="Home Legacy Program · Poe Properties extension" desc="Ethical purchase program for elderly homeowners who want certainty their home will be cared for after they pass — when family inheritance isn't a clean option. Not a marketplace. Not a flip. Relationship-based, attorney-required, family-involved when possible. This is genuinely sensitive territory; we approach it with deep care because Yahweh names the elderly as deserving particular care." features={['Years of relationship before any purchase conversation','Elderly homeowner ALWAYS has their own attorney (we pay if needed)','Family involvement required when family exists','Fair market value pricing · independently documented','Life estate option — they live there until death, paid up front or monthly','Property maintenance commitment baked into the agreement','No high-pressure sales · they walk if they want','Elder abuse prevention training for everyone involved','Transparent reporting of every transaction to a community advisory board','Alternative to probate sales and state escheat']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
          <ModuleCard moduleKey="spiritual" status="vision" title="Spiritual Life · The Godhead Study Platform" desc="An interactive tool for studying The Godhead, original business systems from a biblical worldview, and the philosophy of technology in light of scripture. FREE for every family — Foundation tier and above. The Poe family worldview, derived from biblical scriptures with algorithmic rigor, made interactive. A stronghold made visible in daily study." features={['FREE tier — included with every PoeTech subscription including Foundation','Interactive Godhead study (Father · Son · Holy Spirit · their unity and distinction)','Original Business Systems study — biblical economics, stewardship, the seven-year cycle, debt-jubilee patterns','Technology Study — philosophy of technology from a biblical worldview','Built-in Bookstore — digital download + Amazon physical order','📖 The Holy Spirit Integration Worldview (Darrell Poe, forthcoming) — the foundational text','📖 Christina Poe (forthcoming) — clinical & community wisdom','Family prayer journal · scripture study plans · ministry calendar','Algorithm-driven study paths · personalized scripture walks','Local-first study notes · device-only by default']} moduleInterest={moduleInterest} toggleModuleInterest={toggleModuleInterest} />
        </div>
      </section>

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

      <section>
        <SectionTitle>Pricing · Premium Positioning</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
          The Financial Control System is free for every family. Paid tiers reflect the real value being delivered — each one replaces multiple existing SaaS subscriptions. PoeTech is priced like the premium platform it is, not like a hobby app. <strong>Free access at two layers</strong> for the work of justice: families served by partner orgs, and the mission-aligned orgs themselves.
        </p>
        <div className="space-y-3">
          <PricingTier name="Foundation" tagline="Financial Control System · always free" monthly="0" annual="0" replaces="YNAB, basic budget apps, free tier of family planners — typically $50-$100/mo equivalent" features={['Full Financial module','Multi-entity bookkeeping','Debt avalanche & rental snowball','Tax calendar · recurring obligations · incidents','Scope-of-work agreements','Event reminders','Local-first · device-only storage']} highlight onChoose={openCart} />
          <PricingTier name="Loved Ones · Founding Family" tagline="Free PoeTech+ upgrade for life · First 100 families through Church of the Living God or by direct invitation" monthly="0" annual="0" replaces="Lifetime savings of ~$468/yr per family at current prices · more as prices rise" features={['Everything in Foundation','Cross-device sync (opt-in cloud)','Encrypted cloud backup','Multi-user household sharing','Locked in for life — even when prices change','First 100 families only · tier closes when filled','One month Family-tier credit per paying family you refer']} community onChoose={openCart} />
          <PricingTier name="Community · Families in Need" tagline="Free access for families · sponsored by paying subscribers" monthly="0" annual="0" features={['Available through partner Churches','And 501(c)(3) organizations serving the poor, elderly, fatherless','Verification through partner org · not the family','Full Foundation + PoeTech+ features','Designed to remove stigma — help comes from the community','Paying subscribers fund this tier transparently']} community onChoose={openCart} />
          <PricingTier name="Community Partners · Organizations" tagline="Free PoeTech for mission-aligned orgs that serve the underserved" monthly="0" annual="0" features={['Free for verified 501(c)(3) nonprofits + faith-based ministries','Serving: poor · elderly · fatherless · incarcerated/reentry · unhoused · disabled · mental health · literacy','Full PoeTech platform for the organization itself','Practice Operations for case management (no PHI)','Aggregate community-trend data for advocacy and grant applications','Custom data exports for board meetings, funders, and community awareness','Listed in PoeTech Community Partners directory','Verified annually · service area documented · mission alignment confirmed']} community onChoose={openCart} />
          <PricingTier name="PoeTech+" tagline="Data governance & sync" monthly="39" annual="390" replaces="$100-$150/mo equivalent in cloud-sync budgeting tools, paid YNAB tier, encrypted backup services" features={['Everything in Foundation','Cross-device sync (opt-in cloud)','Encrypted cloud backup','Multi-user household sharing','Historical data stability','Priority email support']} onChoose={openCart} />
          <PricingTier name="Family" tagline="+ Home Command Center" monthly="89" annual="890" replaces="$200-$300/mo equivalent: Ring/Nest subscriptions, home maintenance apps, HomeKit fees, basic property management tools" features={['Everything in PoeTech+','Home Command Center module','IoT sensor integration','Seasonal maintenance calendar','F&S-level alarms','Floor plan mapping']} onChoose={openCart} />
          <PricingTier name="Premium" tagline="Small-business stewardship · all modules" monthly="149" annual="1490" replaces="$400-$600/mo equivalent: QuickBooks Self-Employed, Acuity HIPAA, Calendly Pro, Buffer, ConvertKit, household + business apps stack" features={['Everything in Family','Health & Wellness module','Education & Children · Literacy Justice','PoeTech Tutors marketplace (when launched)','All future modules included','PoeTech Marketplace access','Practice Operations for small business','Note: Spiritual Life · Godhead Study Platform is FREE for every tier']} onChoose={openCart} />
          <PricingTier name="PoeTech Business" tagline="Multi-entity, multi-user, multi-purpose · for serious small businesses" monthly="249" annual="2490" replaces="$700-$1,000/mo equivalent: QuickBooks for multiple entities, full marketing stack, advanced CRM, payroll integrations, SimplePractice or equivalent EHR-adjacent tooling" features={['Everything in Premium','Up to 10 entities tracked','Up to 5 staff/team users','Advanced reporting & exports','API access for custom integrations','Priority phone + Slack support','Quarterly strategy review with PoeTech Services','Eligible for revenue-share consulting partnership']} business onChoose={openCart} />
        </div>
        <p className="text-xs text-[#5A5751] italic mt-4" style={{ fontFamily: '"Fraunces", serif' }}>
          Annual pricing reflects ~17% savings (2 months free). Foundation is free forever — to generate the experience and the data that improves the system for every family. Loved Ones tier honors the warm-market relationships that make PoeTech viable: people who already know us, trust us, and pray for us. Their early adoption is the foundation everything else stands on — and their pricing is locked even as the broader pricing reflects the platform's growing value.
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
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Interested in Sponsoring PoeTech?</div>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          We accept sponsor applications from mission-aligned organizations only. Before applying, read the 8-criterion framework above and the never-allowed list. If your organization fits, send a one-page introduction including: your mission, business model, ownership, regulatory status, customer reference contacts, and which tier you're applying for.
        </p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Submit to <strong>sponsorship@poetech.us</strong> (to be set up). Expect 3-5 weeks for the vetting process. Limited slots — current opening status published quarterly.
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
                    <button onClick={() => { if (confirm('Delete this checkout intent?')) deleteCheckoutIntent(ci.id); }} className="text-[#5A5751] hover:text-[#B85838] text-xs">×</button>
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
              {cartTier.monthly !== '0' ? (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#5A5751] block mb-2">Billing cycle</label>
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

              <button onClick={() => submitCart(cartTier.monthly === '0' ? 'claim' : 'subscribe')} className="w-full bg-[#1A1815] text-white py-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">
                {cartTier.monthly === '0' ? 'Claim it · Send confirmation email' : 'Subscribe · Send confirmation email'}
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

function MarketCard({ title, need, have }) {
  return (
    <div className="bg-white border border-[#1A1815] p-4">
      <h4 className="text-sm mb-1.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{title}</h4>
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium mt-2">Need</div>
      <p className="text-xs leading-relaxed mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{need}</p>
      <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-medium">What PoeTech has today</div>
      <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{have}</p>
    </div>
  );
}

function PricingTier({ name, tagline, monthly, annual, features, replaces, highlight, community, business, onChoose }) {
  const borderClass = highlight ? 'border-[#5A6E3D] border-2' : community ? 'border-[#B85838] border-2' : business ? 'border-[#1A1815] border-2' : 'border-[#1A1815]';
  const isFree = monthly === '0';
  const buttonLabel = isFree ? 'Claim it →' : 'Subscribe →';
  const buttonColor = highlight ? 'bg-[#5A6E3D] hover:bg-[#1A1815]' : community ? 'bg-[#B85838] hover:bg-[#1A1815]' : business ? 'bg-[#1A1815] hover:bg-[#B85838]' : 'bg-[#1A1815] hover:bg-[#B85838]';
  return (
    <div className={`bg-white border ${borderClass} p-5`}>
      <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
        <div>
          <h3 className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{name}</h3>
          <div className="text-xs text-[#5A5751] mt-0.5">{tagline}</div>
        </div>
        <div className="text-right shrink-0">
          {monthly === '0' ? (
            <div className="text-2xl text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Free</div>
          ) : (
            <>
              <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>${monthly}<span className="text-sm text-[#5A5751]">/mo</span></div>
              <div className="text-xs text-[#5A5751]">or ${annual}/yr</div>
            </>
          )}
        </div>
      </div>
      {replaces && (
        <div className="mb-3 px-3 py-2 bg-[#FAF8F4] border-l-2 border-[#5A6E3D]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A6E3D] font-medium mb-0.5">Replaces</div>
          <div className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>{replaces}</div>
        </div>
      )}
      <ul className="text-xs text-[#1A1815] space-y-1 mt-3">
        {features.map((f, i) => <li key={i} className="flex gap-2"><span className={highlight ? 'text-[#5A6E3D]' : business ? 'text-[#1A1815]' : 'text-[#B85838]'}>·</span><span>{f}</span></li>)}
      </ul>
      {onChoose && (
        <button onClick={() => onChoose({ name, tagline, monthly, annual, features, replaces })} className={`mt-4 w-full text-white text-xs uppercase tracking-wider py-2.5 font-semibold ${buttonColor}`}>{buttonLabel}</button>
      )}
    </div>
  );
}

function CommunityPriorities({ moduleInterest }) {
  const interests = Object.entries(moduleInterest || {}).map(([key, val]) => {
    const priority = typeof val === 'object' ? val?.priority : 'nice';
    const pts = priority === 'critical' ? 5 : priority === 'important' ? 3 : 1;
    return { key, priority, pts };
  });
  if (interests.length === 0) return null;
  const totalPts = interests.reduce((s, i) => s + i.pts, 0);
  const labels = {
    'home-command': 'Home Command Center',
    'health-wellness': 'Health & Wellness',
    'marketplace': 'PoeTech Marketplace',
    'practice-ops': 'Practice Operations',
    'marketing-growth': 'Marketing & Growth',
    'education': 'Education · Literacy Justice',
    'tutors': 'PoeTech Tutors · Educator Marketplace',
    'elder-care-coord': 'Elder Care Coordination',
    'elder-marketplace': 'Elder Care · 1099 Marketplace',
    'home-legacy': 'Home Legacy Program',
    'spiritual': 'Spiritual Life',
  };
  return (
    <div className="bg-white border border-[#B85838] p-4 mb-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-2">Your Priority Votes · {totalPts} total points</div>
      <div className="space-y-1.5">
        {interests.sort((a,b) => b.pts - a.pts).map(i => {
          const pct = (i.pts / 5) * 100;
          return (
            <div key={i.key}>
              <div className="flex justify-between text-xs mb-0.5">
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{labels[i.key] || i.key}</span>
                <span className="text-[#5A5751] uppercase tracking-wider text-[10px]">{i.priority} · {i.pts}pt</span>
              </div>
              <div className="h-1 bg-[#E8E4DC]"><div className="h-full bg-[#B85838]" style={{ width: `${pct}%` }}></div></div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
        When this is multiplied across thousands of families, the highest-weighted modules get built first. Your vote is real input on the roadmap.
      </p>
    </div>
  );
}

function ModuleCard({ moduleKey, status, title, repo, desc, features, moduleInterest, toggleModuleInterest }) {
  const [showPriority, setShowPriority] = useState(false);
  const s = { active: { label: 'Active', border: 'border-[#1A1815]', tag: 'text-[#5A6E3D]' }, planned: { label: 'Planned', border: 'border-[#E8E4DC]', tag: 'text-[#B85838]' }, vision: { label: 'Vision', border: 'border-[#E8E4DC] border-dashed', tag: 'text-[#5A5751]' } }[status];
  const interest = moduleKey && moduleInterest ? moduleInterest[moduleKey] : null;
  // Support both old format (string) and new format (object)
  const isInterested = !!interest;
  const interestPriority = typeof interest === 'object' ? interest?.priority : (interest ? 'nice' : null);
  const interestDate = typeof interest === 'object' ? interest?.signedAt : interest;
  const canSignal = status !== 'active' && moduleKey && toggleModuleInterest;

  const priorities = [
    { key: 'nice',      label: 'Nice to have',    pts: '1pt', emoji: '✓' },
    { key: 'important', label: 'Important to me', pts: '3pts', emoji: '⭐' },
    { key: 'critical',  label: 'Critical · build first', pts: '5pts', emoji: '⭐⭐' },
  ];
  const priorityInfo = priorities.find(p => p.key === interestPriority);

  return (
    <div className={`bg-white border ${s.border} p-5`}>
      <div className="flex items-baseline justify-between mb-1 gap-3">
        <h3 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{title}</h3>
        <span className={`text-[10px] uppercase tracking-[0.2em] font-medium shrink-0 ${s.tag}`}>{s.label}</span>
      </div>
      {repo && <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-2">{repo}</div>}
      <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>{desc}</p>
      <ul className="text-xs text-[#5A5751] space-y-1 mb-3">
        {features.map((f, i) => (<li key={i} className="flex gap-2"><span className="text-[#B85838]">·</span><span>{f}</span></li>))}
      </ul>
      {canSignal && (
        <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
          {isInterested ? (
            <div className="space-y-1.5">
              <button onClick={() => toggleModuleInterest(moduleKey, null)} className="w-full text-xs uppercase tracking-wider py-2 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#FAF8F4]">
                {priorityInfo?.emoji || '✓'} On the list · {priorityInfo?.label || 'interested'} · since {interestDate ? new Date(interestDate).toLocaleDateString() : 'recently'}
              </button>
              <div className="flex gap-1 text-[10px] uppercase tracking-wider">
                <span className="text-[#5A5751] py-1">Change priority:</span>
                {priorities.filter(p => p.key !== interestPriority).map(p => (
                  <button key={p.key} onClick={() => toggleModuleInterest(moduleKey, p.key)} className="px-1.5 py-1 text-[#5A5751] hover:text-[#B85838]">{p.emoji} {p.label}</button>
                ))}
              </div>
            </div>
          ) : showPriority ? (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">How important is this to your family?</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                {priorities.map(p => (
                  <button key={p.key} onClick={() => { toggleModuleInterest(moduleKey, p.key); setShowPriority(false); }} className="text-xs px-2 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#FAF8F4] hover:text-[#1A1815] text-left">
                    <div>{p.emoji} {p.label}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">{p.pts} priority weight</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowPriority(false)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowPriority(true)} className="w-full text-xs uppercase tracking-wider py-2 border border-[#B85838] text-[#B85838] hover:bg-[#FAF8F4] hover:text-[#1A1815]">
              🔔 Notify me · vote on priority
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children, eyebrow }) {
  return (
    <div className="mb-5 pb-3 border-b-2 border-[#1A1815] section-title-wrapper">
      {eyebrow && <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1.5 font-semibold">{eyebrow}</div>}
      <h2 className="text-2xl sm:text-3xl leading-tight section-title-text" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{children}</h2>
    </div>
  );
}

function MetricCell({ label, value, sub, accent, small }) {
  const valueColor = accent === 'green' ? 'text-[#5A6E3D]' : accent === 'rust' ? 'text-[#B85838]' : 'text-[#1A1815]';
  return (<div className="bg-[#FAF8F4] p-2.5 sm:p-3"><div className="text-[9px] uppercase tracking-[0.15em] text-[#5A5751] mb-1 leading-tight">{label}</div><div className={`${small ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'} ${valueColor} leading-tight`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{value}</div>{sub && <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mt-0.5 leading-tight">{sub}</div>}</div>);
}
