// =============================================================================
// opportunity-capacity — the ITSM urgency taxonomy + capacity math + the
// opportunity library (moved out of the monolith shell 2026-07-03, second
// extraction of the modularization lane; behavior unchanged by design).
// =============================================================================
// One mental model the whole family operates from, across rentals, maintenance,
// finance, ministry: Change (broken now, same-day) / Incident (resolve within
// ~3 days) / Project (multi-day planned work). capacitySnapshot() and
// capacityDecisionForNewProject() keep new commitments honest against the
// family's real hours; OPPORTUNITY_LIBRARY + matchOpportunities() power the
// Dev/Ops personalized options. Consumed by the shell (Action Queue due dates,
// Dev/Ops props) and components/BigPictureDashboard.jsx.
// =============================================================================
// v28+ MVP v1.5 round 10 — ITSM-style urgency taxonomy
// Change   = broken NOW, must be acted on today (same-day due)
// Incident = needs resolution within ~3 days
// Project  = takes longer than 3 days, treated as planned work
// Same shape across rentals, maintenance, finance, ministry — one mental model
// the whole family operates from. Linked items can point back to the source
// (property, project, account) so the Action Queue can deep-link.
// =============================================================================
export const URGENCY_BANDS = [
  { key: 'change',   label: 'Change',   tagline: 'Broken now · same-day',  dueDays: 0, accent: '#B85838', symbol: '⚡', order: 1 },
  { key: 'incident', label: 'Incident', tagline: 'Resolve within 3 days',  dueDays: 3, accent: '#D97706', symbol: '!',  order: 2 },
  { key: 'project',  label: 'Project',  tagline: 'Multi-day planned work', dueDays: 14,accent: '#5A6E3D', symbol: '◆',  order: 3 },
];
// Derived helper kept available for form validation / filter UIs. Exported
// so future consumers can import rather than recompute.
export const URGENCY_KEYS = URGENCY_BANDS.map(u => u.key);
export const URGENCY_INDEX = Object.fromEntries(URGENCY_BANDS.map(u => [u.key, u]));
// Compute a default due date based on urgency: today + N days.
export const dueDateFor = (urgencyKey, fromDate = new Date()) => {
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
// Statuses that count toward the family's real hours (round 11: 'tbd' parks
// over-capacity projects; they don't count until explicitly promoted).
export const PROJECT_STATUSES_ACTIVE = ['planning', 'active', 'ending-soon'];

export function capacitySnapshot(projects = [], skillProfiles = []) {
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
export function capacityDecisionForNewProject(projects, skillProfiles, newProjectHpw, opts = {}) {
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
export const OPPORTUNITY_LIBRARY = [
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
export function matchOpportunities(profile, library) {
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
