// =============================================================================
// tlc-outreach-targets — the TLC Therapy Solutions community-outreach directory
// =============================================================================
// The curated list of local organizations Christina's practice introduces
// itself to for referral relationships. Source: Zakaria's two lists, sent to
// Christina and brought as build input by Darrell 2026-07-27 (screenshots dated
// 2026-07-22 "Places to email" and 2026-07-23 "Breast cancer places"). This
// file is the versioned source of truth for the starter directory — "enough is
// there to start it, and then she can add to it as we go along." New targets
// are added here (or captured directly on the CRM board) as the list grows.
//
// ONE-CRM (DR-0081): this is NOT a second CRM. It is reference data that seeds
// leads into the one backbone (crm_leads) via the 'tlc-community-outreach'
// pipeline in lib/crm-engine.js. targetToLead() is the adapter.
//
// PROVENANCE + VERIFICATION (DR-0076): names, roles-to-reach, and phone numbers
// are transcribed from the source lists AS PROVIDED — they have not been
// independently verified against each organization. Verify a number before
// relying on it. Obvious source-list misspellings were normalized to the real
// local institutions ("Champagne Central" → Champaign Central, "Bottonfield" →
// Bottenfield, "Carl's / Carl OB/GYN" → Carle); nothing else was altered.
//
// PRIVACY / NO-PHI: every entry is an ORGANIZATION-level public contact
// (a public inbox, a front-office phone, a role title — never a private
// individual, never a client or patient). Notes stay org-level, always.
// =============================================================================
import { newLead } from './crm-engine.js';

export const TLC_OUTREACH_PROVENANCE = {
  providedBy: 'Zakaria (via Christina)',
  broughtBy: 'Darrell, 2026-07-27',
  sourceDates: ['2026-07-22', '2026-07-23'],
  contactInfoVerified: false, // DR-0076: transcribed as provided, not independently verified
  normalizedSpellings: [
    '"Champagne Central high" → Champaign Central High School',
    '"Bottonfield" → Bottenfield Elementary School',
    '"Carl\'s women\'s health" / "Carl OB/GYN" → Carle',
  ],
};

// The two cohorts of the starter directory.
export const OUTREACH_COHORTS = {
  'cu-community': {
    key: 'cu-community',
    label: 'Champaign-Urbana community (places to email)',
    region: 'Champaign-Urbana, IL',
    intent: 'Local referral relationships for the practice: schools, youth organizations, shelters, hospitals, nonprofits, and women\'s health clinics.',
  },
  'breast-cancer-centers': {
    key: 'breast-cancer-centers',
    label: 'Breast cancer centers (Chicago area)',
    region: 'Chicago area, IL',
    intent: 'Oncology-adjacent referral relationships: navigators, oncology social workers, and survivorship coordinators who connect patients with counseling support.',
  },
};

export const OUTREACH_CATEGORIES = {
  'schools':          { key: 'schools',          cohort: 'cu-community',          label: 'Schools' },
  'youth-orgs':       { key: 'youth-orgs',       cohort: 'cu-community',          label: 'Youth organizations' },
  'dv-shelters':      { key: 'dv-shelters',      cohort: 'cu-community',          label: 'Domestic violence shelters' },
  'hospitals':        { key: 'hospitals',        cohort: 'cu-community',          label: 'Community hospitals' },
  'nonprofits':       { key: 'nonprofits',       cohort: 'cu-community',          label: 'Local nonprofits' },
  'womens-health':    { key: 'womens-health',    cohort: 'cu-community',          label: 'OB/GYN & women\'s health clinics' },
  'cancer-centers':   { key: 'cancer-centers',   cohort: 'breast-cancer-centers', label: 'Breast cancer centers' },
};

// A target: { slug, name, category, city?, reach? (best person/role to ask for),
// phone?, email? }. Contact fields absent = Christina adds them as she goes.
export const TLC_OUTREACH_TARGETS = [
  // --- Schools (Champaign-Urbana) --------------------------------------------
  { slug: 'centennial-high',            name: 'Centennial High School',                       category: 'schools' },
  { slug: 'champaign-central-high',     name: 'Champaign Central High School',                category: 'schools' },
  { slug: 'urbana-high',                name: 'Urbana High School',                           category: 'schools' },
  { slug: 'carrie-busey-elementary',    name: 'Carrie Busey Elementary School',               category: 'schools' },
  { slug: 'barkstall-elementary',       name: 'Barkstall Elementary School',                  category: 'schools' },
  { slug: 'bottenfield-elementary',     name: 'Bottenfield Elementary School',                category: 'schools' },
  { slug: 'dr-howard-elementary',       name: 'Dr. Howard Elementary School',                 category: 'schools' },
  { slug: 'kenwood-elementary',         name: 'Kenwood Elementary School',                    category: 'schools' },
  { slug: 'westview-elementary',        name: 'Westview Elementary School',                   category: 'schools' },
  { slug: 'international-prep-academy', name: 'International Prep Academy',                   category: 'schools' },

  // --- Youth organizations ----------------------------------------------------
  { slug: 'boys-girls-club',            name: 'Boys and Girls Club',                          category: 'youth-orgs' },
  { slug: 'girl-scouts-central-il',     name: 'Girl Scouts of Central Illinois',              category: 'youth-orgs' },
  { slug: 'boy-scouts-prairielands',    name: 'Boy Scouts of America — Prairielands Council', category: 'youth-orgs' },
  { slug: 'ymca',                       name: 'YMCA',                                         category: 'youth-orgs' },
  { slug: 'dreaam-house',               name: 'DREAAM House',                                 category: 'youth-orgs' },
  { slug: 'cc-youth-assessment-center', name: 'Champaign County Youth Assessment Center',     category: 'youth-orgs' },

  // --- Domestic violence shelters --------------------------------------------
  { slug: 'courage-connection',         name: 'Courage Connection',                           category: 'dv-shelters' },
  { slug: 'a-womans-place',             name: 'A Woman\'s Place',                             category: 'dv-shelters' },
  { slug: 'races',                      name: 'RACES — Rape Advocacy, Counseling & Education Services', category: 'dv-shelters' },
  { slug: 'austins-place',              name: 'Austin\'s Place Shelter for Women',            category: 'dv-shelters' },

  // --- Community hospitals ----------------------------------------------------
  { slug: 'carle-foundation-hospital',  name: 'Carle Foundation Hospital',                    category: 'hospitals' },
  { slug: 'osf-heart-of-mary',          name: 'OSF Heart of Mary Medical Center',             category: 'hospitals' },
  { slug: 'pavilion-behavioral-health', name: 'The Pavilion Behavioral Health System',        category: 'hospitals' },
  { slug: 'gibson-area-hospital',       name: 'Gibson Area Hospital',                         category: 'hospitals' },
  { slug: 'kirby-medical-center',       name: 'Kirby Medical Center',                         category: 'hospitals' },

  // --- Local nonprofits -------------------------------------------------------
  { slug: 'crisis-nursery',                 name: 'Crisis Nursery',                                        category: 'nonprofits' },
  { slug: 'center-youth-family-solutions',  name: 'The Center for Youth and Family Solutions',             category: 'nonprofits' },
  { slug: 'community-service-center-ncc',   name: 'Community Service Center of Northern Champaign County', category: 'nonprofits' },
  { slug: 'eastern-illinois-foodbank',      name: 'Eastern Illinois Foodbank',                             category: 'nonprofits' },
  { slug: 'salvation-army-champaign',       name: 'The Salvation Army of Champaign County',                category: 'nonprofits' },
  { slug: 'daily-bread-soup-kitchen',       name: 'Daily Bread Soup Kitchen',                              category: 'nonprofits' },

  // --- OB/GYN & women's health clinics ---------------------------------------
  { slug: 'carle-womens-health',        name: 'Carle Women\'s Health',                        category: 'womens-health' },
  { slug: 'christie-clinic-obgyn',      name: 'Christie Clinic OB/GYN',                       category: 'womens-health' },
  { slug: 'promise-healthcare-womens',  name: 'Promise Healthcare Women\'s Health',           category: 'womens-health' },
  { slug: 'osf-womens-health',          name: 'OSF Women\'s Health',                          category: 'womens-health' },
  { slug: 'carle-obgyn-dr-dillard',     name: 'Carle OB/GYN — Dr. Tiffany C. Dillard',        category: 'womens-health' },
  { slug: 'carle-obgyn-dr-faye',        name: 'Carle OB/GYN — Dr. Nancy Faye',                category: 'womens-health' },
  { slug: 'christie-obgyn-dr-young',    name: 'Christie Clinic OB/GYN — Dr. Sarah Young',     category: 'womens-health' },

  // --- Breast cancer centers (Chicago area) — reach = best person/role to ask
  // for at the front desk; phones transcribed as provided (verify before use).
  { slug: 'lurie-cancer-center',        name: 'Robert H. Lurie Comprehensive Cancer Center',  category: 'cancer-centers', city: 'Chicago, IL',
    reach: 'Breast Nurse Navigator, Oncology Social Worker, or Lynn Sage Comprehensive Breast Center Referral Coordinator', phone: '(312) 695-0990' },
  { slug: 'rush-md-anderson',           name: 'RUSH MD Anderson Cancer Center',               category: 'cancer-centers', city: 'Chicago, IL',
    reach: 'Breast Program Navigator, Oncology Social Worker, or Community Outreach Coordinator', phone: '(312) 563-2531' },
  { slug: 'rush-comprehensive-breast',  name: 'Comprehensive Breast Center at Rush',          category: 'cancer-centers', city: 'Chicago, IL',
    reach: 'Breast Nurse Navigator or Referral Coordinator', phone: '(312) 563-2325' },
  { slug: 'uchicago-cancer-center',     name: 'University of Chicago Comprehensive Cancer Center', category: 'cancer-centers', city: 'Chicago, IL',
    reach: 'Breast Cancer Nurse Navigator or Oncology Social Worker', phone: '(855) 702-8222', email: 'BreastCancerProgram@uchicagomedicine.org' },
  { slug: 'ui-health-cancer-center',    name: 'UI Health Cancer Center',                      category: 'cancer-centers', city: 'Chicago, IL',
    reach: 'Breast Nurse Navigator, Patient Navigator, or Oncology Social Worker', phone: '(312) 355-1625' },
  { slug: 'city-of-hope-zion',          name: 'City of Hope Cancer Center Chicago',           category: 'cancer-centers', city: 'Zion, IL',
    reach: 'Survivorship Coordinator, Patient Navigator, or Community Outreach', phone: '(877) 524-4673' },
  { slug: 'advocate-illinois-masonic',  name: 'Advocate Illinois Masonic Cancer Institute',   category: 'cancer-centers', city: 'Chicago, IL',
    reach: 'Oncology Social Worker or Director of Oncology Services', phone: '(800) 323-8622' },
  { slug: 'kellogg-cancer-center',      name: 'Kellogg Cancer Center',                        category: 'cancer-centers', city: 'Evanston, IL',
    reach: 'Breast Care Coordinator, Oncology Social Worker, or Nurse Navigator', phone: '(847) 570-2112' },
  { slug: 'maggie-daley-center',        name: 'Maggie Daley Center for Women\'s Cancer Care', category: 'cancer-centers', city: 'Chicago, IL',
    reach: 'Women\'s Cancer Patient Navigator or Survivorship Coordinator', phone: '(866) 587-4322' },
  { slug: 'northwestern-st-george',     name: 'Northwestern Medicine St. George Cancer Institute', category: 'cancer-centers', city: 'Orland Park, IL',
    reach: 'Breast Surgery Referral Coordinator, Oncology Social Worker, or Community Outreach', phone: '(708) 226-2318' },
];

// -----------------------------------------------------------------------------
// Lookups.
// -----------------------------------------------------------------------------
export function cohortOf(target) {
  const cat = OUTREACH_CATEGORIES[target && target.category];
  return cat ? cat.cohort : null;
}
export function targetsForCategory(categoryKey) {
  return TLC_OUTREACH_TARGETS.filter((t) => t.category === categoryKey);
}
export function targetsForCohort(cohortKey) {
  return TLC_OUTREACH_TARGETS.filter((t) => cohortOf(t) === cohortKey);
}
export function categoriesForCohort(cohortKey) {
  return Object.values(OUTREACH_CATEGORIES).filter((c) => c.cohort === cohortKey);
}

// The stable lead id a target seeds. Deliberately NOT a seed-/demo- prefix:
// these are REAL outreach targets, and the slug rides crm_leads' unique
// (instance_id, slug) index so a re-import can never duplicate a lead.
export function targetLeadId(target) {
  return `tlc-target-${target.slug}`;
}

// -----------------------------------------------------------------------------
// targetToLead — the ONE-CRM adapter. A directory target becomes a canonical
// lead on the 'tlc-community-outreach' pipeline (business 'tlc'). Consent
// starts FALSE on purpose: the first touch is a human-sent professional
// introduction from Christina; a recorded reply/opt-in is what unlocks the
// nurture drafts (served, not surveilled). Notes stay org-level — no PHI.
// -----------------------------------------------------------------------------
export function targetToLead(target, opts = {}) {
  if (!target) return null;
  const cat = OUTREACH_CATEGORIES[target.category] || {};
  const coh = OUTREACH_COHORTS[cat.cohort] || {};
  const noteBits = [
    target.reach ? `Ask for: ${target.reach}.` : null,
    target.phone ? `Phone (as provided, verify before use): ${target.phone}.` : null,
    `From ${coh.label || 'the outreach list'} — provided by Zakaria via Christina.`,
  ].filter(Boolean);
  return newLead({
    id: targetLeadId(target),
    business: 'tlc',
    pipeline: 'tlc-community-outreach',
    stage: 'new',
    name: target.name,
    org: target.name,
    role: target.reach || '',
    contactMethod: target.email ? 'email' : (target.phone ? 'phone' : 'email'),
    contactValue: target.email || target.phone || '',
    source: 'community-list',
    sourceDetail: [cat.label, target.city || coh.region].filter(Boolean).join(' · '),
    signalTags: [cat.cohort, target.category].filter(Boolean),
    notes: noteBits.join(' '),
    consent: { outreachOk: false, channels: [], capturedAt: null, note: 'Directory target — record consent when the organization replies/opts in.' },
    seed: false,
  }, opts);
}
