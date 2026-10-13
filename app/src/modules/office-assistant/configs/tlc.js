// =============================================================================
// configs/tlc — TLC Therapy Solutions as the FIRST office config
// =============================================================================
// Everything that was hardcoded in lib/referral-ops.js now lives here as DATA.
// This is the whole point of the module: TLC is one config; another office is
// another config file (copy configs/_template.js). The values are extracted
// verbatim from the original referral-ops.js so behavior is byte-for-byte the
// same — the existing lib/referral-ops.js now binds the model to THIS config
// (backward-compat), so TLC keeps working and the module is reusable.
//
// storageKey is the ORIGINAL key ('poetech-referral-ops-v1') so no existing
// device-local TLC data is orphaned by the extraction.
// =============================================================================
import { defineOfficeConfig } from '../config.js';

export const TLC_CONFIG = defineOfficeConfig({
  id: 'tlc',
  brand: 'TLC Therapy Solutions',
  brandTagline: 'assistant + referral network',
  serviceArea: 'Champaign-Urbana, Illinois',
  storageKey: 'poetech-referral-ops-v1',
  noPhiNote:
    'Referral sources only — organizations and office contacts, never clients or any protected health information. TLC keeps client data out of this workspace.',

  referralCategories: [
    { id: 'medical', label: 'Medical', types: ['Primary care physicians', 'Pediatricians', 'OB/GYN offices', 'Nurse practitioners', 'Urgent care', 'Hospitals', 'Oncology / cancer centers', 'Neurology', 'Pain management', "Women's health clinics"],
      searches: ['primary care physician Champaign IL', 'family medicine Champaign IL', 'OBGYN Champaign IL', 'pediatrician Urbana IL'] },
    { id: 'education', label: 'Education', types: ['School counselors', 'School social workers', 'School psychologists', 'College counseling centers', 'University student affairs', 'Special education coordinators'],
      searches: ['school district Champaign', 'private schools Champaign', 'Christian schools Champaign', 'college counseling center Urbana'] },
    { id: 'community', label: 'Community', types: ['Churches', 'Pastors', 'Community centers', 'Youth organizations', 'Domestic violence organizations', 'Homeless shelters', 'Food pantries', 'Pregnancy resource centers'],
      searches: ['churches Champaign IL', 'Black churches Champaign IL', 'churches Urbana IL', 'community center Champaign'] },
    { id: 'business', label: 'Business', types: ['Human Resources departments', 'Employee Assistance Programs (EAPs)', 'Large employers', 'Manufacturing companies', 'Banks', 'City & county government'],
      searches: ['large employers Champaign IL', 'HR department Champaign', 'manufacturing Champaign IL'] },
    { id: 'legal', label: 'Legal', types: ['Family law attorneys', 'Divorce attorneys', 'Guardianship attorneys', 'Probation offices'],
      searches: ['family law attorney Champaign IL', 'divorce attorney Champaign IL', 'guardianship attorney Champaign'] },
  ],

  geoCircles: [
    'Champaign-Urbana', 'Danville', 'Rantoul', 'Mahomet', 'Monticello', 'Savoy',
    'St. Joseph', 'Tuscola', 'Decatur', 'Bloomington-Normal', 'Springfield', 'Rest of Illinois',
  ],

  outcomes: [
    { id: 'none', label: 'No response yet', open: true },
    { id: 'interested', label: 'Interested', good: true },
    { id: 'requested-info', label: 'Requested more information', good: true },
    { id: 'referral-coordinator', label: 'Has a referral coordinator', good: true },
    { id: 'call-back', label: 'Call back', open: true },
    { id: 'not-interested', label: 'Not interested' },
    { id: 'has-therapist', label: 'Already has a therapist' },
  ],

  dailyRotation: { 1: 'medical', 2: 'medical', 3: 'community', 4: 'education', 5: 'business', 6: 'legal', 0: 'community' },
  dailyTargetContacts: 12,
  weeklyTargets: {
    contacts: { min: 75, max: 100 }, emails: { min: 50, max: 75 }, calls: { min: 25, max: 40 },
    posts: { min: 5, max: 7 }, reels: { min: 2, max: 2 }, flyers: { min: 1, max: 2 },
  },
  networkGoal: { low: 2500, high: 3000 },

  dayBlocks: [
    { time: '12:00–12:20', name: 'Daily CEO meeting', detail: 'Review priorities, check the calendar and deadlines, and write today’s task list.' },
    { time: '12:20–1:20', name: 'Marketing', detail: 'Create social posts, schedule content, design flyers in Canva, update the website.' },
    { time: '1:20–2:30', name: 'Business development', detail: 'Research referral sources, send emails, make outreach calls, update the outreach spreadsheet.' },
    { time: '2:30–3:15', name: 'Poe Tech', detail: 'Test app features, record bugs/suggestions, enter customer + worker payments, verify.' },
    { time: '3:15–4:15', name: 'Executive support', detail: 'Enter QVS appointments, organize the calendar, reminders, grocery list + order (with approval), prep tomorrow.' },
    { time: '4:15–5:00', name: 'Wrap up', detail: 'Organize files + spreadsheets, finish tasks, write the daily summary, review tomorrow together (last 10–15 min debrief).' },
  ],

  weeklyPlan: [
    { day: 'Monday', focus: ['Weekly planning meeting', 'Create the week’s social schedule', 'Build the outreach list', 'Organize the calendar', 'Set weekly priorities'] },
    { day: 'Tuesday', focus: ['Outreach calls + emails', 'Social media creation', 'Poe Tech testing'] },
    { day: 'Wednesday', focus: ['Follow-up calls', 'Send flyers', 'Administrative work', 'Update spreadsheets'] },
    { day: 'Thursday', focus: ['Outreach to new organizations', 'Poe Tech testing', 'Calendar management', 'Marketing content'] },
    { day: 'Friday', focus: ['Finish follow-ups', 'Weekly marketing report', 'Weekly outreach report', 'Organize next week', 'Review meeting'] },
  ],

  contentThemes: [
    { day: 'Monday', theme: 'Mental Health Monday' },
    { day: 'Tuesday', theme: 'Therapy Tip Tuesday' },
    { day: 'Wednesday', theme: 'Wellness Wednesday' },
    { day: 'Thursday', theme: 'Testimonial Thursday' },
    { day: 'Friday', theme: 'Faith & Wellness Friday' },
    { day: 'Saturday', theme: 'Meet the Therapist' },
    { day: 'Sunday', theme: 'Inspirational Quote' },
  ],
  socialPlatforms: ['Facebook', 'Instagram', 'LinkedIn'],
  postStatuses: ['idea', 'drafted', 'scheduled', 'posted'],

  ceoMeetingQuestions: [
    'What are your Top 3 priorities today?',
    'Any appointments I need to know about?',
    'Any flyers or graphics needed?',
    'Any clients or organizations to follow up with?',
    'Any groceries or errands? Any Poe Tech work today?',
  ],

  emailTemplate:
    'Subject: A local counseling resource for the people you serve\n\n' +
    'Good afternoon [Name],\n\n' +
    'My name is [Your name] with TLC Therapy Solutions here in Champaign-Urbana. ' +
    'We provide compassionate, faith-friendly counseling, and we partner with offices ' +
    'like yours so you have a trusted place to refer clients who could use support.\n\n' +
    'I’ve attached our flyer. If you have a referral coordinator, I’d be glad to connect. ' +
    'Thank you for the care you give your community.\n\n' +
    'Warmly,\n[Your name]\nTLC Therapy Solutions',
  callScript:
    'Good afternoon! My name is [Your name]. I’m calling from TLC Therapy Solutions. ' +
    'Could you tell me who handles community referrals or provider information?',

  ariAutomationNote:
    'Inbound learns outbound: when an inquiry names how it found TLC, that attribution teaches which referral sources actually convert — so Ari doubles down on what works.',
  ariAutomationPath: [
    { stage: 1, name: 'Assistant runs it', detail: 'The human assistant works the system; the workspace structures every action into a record — Ari’s training set.', built: true },
    { stage: 2, name: 'Ari drafts', detail: 'Ari suggests today’s targets and writes personalized outreach; the human reviews and sends.', built: false },
    { stage: 3, name: 'Ari sends approved', detail: 'Ari sends approved messages to verified contacts and schedules + logs follow-ups.', built: false },
    { stage: 4, name: 'Ari runs it 24/7', detail: 'Research → draft → send → follow-up → learn from inbound outcomes, around the clock.', built: false },
  ],
  outboundConstraints: [
    { id: 'compliance', label: 'Email/call law', detail: 'CAN-SPAM (real sender identity, physical address, working opt-out) for email; TCPA (consent, do-not-call) for automated calls/texts.' },
    { id: 'deliverability', label: 'Deliverability & reputation', detail: 'Volume cold-sending from a domain without SPF/DKIM/DMARC + warmup + pacing lands in spam and burns the domain — send through compliant infra.' },
    { id: 'verification', label: 'Contact accuracy', detail: 'Contact data goes stale and Ari can hallucinate; verify against a real source before any send so goodwill isn’t wasted on the wrong person.' },
    { id: 'human-touch', label: 'The relationship is human', detail: 'Physicians, pastors, and HR convert on trust; automation handles research/logistics, the relational touch stays human — especially early.' },
    { id: 'attribution', label: 'Attribution quality', detail: 'Inbound-learns-outbound only works if intake reliably records HOW each inquiry found TLC — bad attribution optimizes the wrong sources.' },
    { id: 'licensure', label: 'Service area', detail: 'Christina is licensed in Illinois — outreach beyond where TLC can actually serve is wasted or misleading.' },
  ],

  seedOrgs: [
    { id: 'seed-org-01', organization: 'Sample Family Medicine (CU)', categoryId: 'medical', type: 'Primary care physicians', circle: 'Champaign-Urbana', jobTitle: 'Practice Manager', flyerSent: true, emailedOn: '2026-07-10T15:00:00.000Z', followUpOn: '2026-07-17T15:00:00.000Z', outcomeId: 'requested-info', clientsReferred: 3, addedIso: '2026-07-10T15:00:00.000Z' },
    { id: 'seed-org-02', organization: 'Sample Community Church (CU)', categoryId: 'community', type: 'Churches', circle: 'Champaign-Urbana', jobTitle: 'Administrative Assistant', flyerSent: true, emailedOn: '2026-07-10T16:00:00.000Z', outcomeId: 'interested', clientsReferred: 2, addedIso: '2026-07-10T16:00:00.000Z' },
    { id: 'seed-org-03', organization: 'Sample School District (CU)', categoryId: 'education', type: 'School counselors', circle: 'Champaign-Urbana', jobTitle: 'School Counselor', outcomeId: 'none', addedIso: '2026-07-11T14:00:00.000Z' },
    { id: 'seed-org-04', organization: 'Sample Employer HR (CU)', categoryId: 'business', type: 'Employee Assistance Programs (EAPs)', circle: 'Champaign-Urbana', jobTitle: 'HR Manager', calledOn: '2026-07-11T18:00:00.000Z', outcomeId: 'call-back', followUpOn: '2026-07-15T18:00:00.000Z', addedIso: '2026-07-11T18:00:00.000Z' },
    { id: 'seed-org-05', organization: 'Sample Family Law Office (CU)', categoryId: 'legal', type: 'Family law attorneys', circle: 'Champaign-Urbana', jobTitle: 'Office Manager', outcomeId: 'none', addedIso: '2026-07-12T15:00:00.000Z' },
  ],
  seedPosts: [
    { id: 'seed-post-01', theme: 'Mental Health Monday', caption: 'Sample caption — a gentle reminder that asking for help is strength.', platforms: ['Facebook', 'Instagram'], hashtags: '#MentalHealthMonday #TLCTherapy', status: 'posted', createdIso: '2026-07-06T13:00:00.000Z' },
    { id: 'seed-post-02', theme: 'Therapy Tip Tuesday', caption: 'Sample caption — name the feeling, then choose the next small step.', platforms: ['Instagram', 'LinkedIn'], hashtags: '#TherapyTipTuesday', status: 'scheduled', createdIso: '2026-07-07T13:00:00.000Z' },
  ],
});
