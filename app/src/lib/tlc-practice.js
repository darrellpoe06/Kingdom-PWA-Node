// =============================================================================
// tlc-practice — TLC Therapy Solutions' PUBLIC practice facts, one source
// =============================================================================
// The clinical-team roster + insurance line shown on the main app's Practice
// tab AND on business doors' Practice tab (Darrell 2026-07-07: "I want the
// practice tab to show the therapists on MooreDivahs instance"). Extracted from
// components/Practice.jsx so the door renders the SAME record, never a copy
// that drifts.
//
// PRIVACY (the TLC bright line): everything here is Christyn's PUBLIC marketing
// content — names, roles, specialties, portal links, and headshots already
// published on tlctherapysolutions.me. No clients, no PHI, nothing clinical.
// =============================================================================

export const TLC_TEAM = [
  { name: 'Christina Poe, LCSW', role: 'Founder · Lead Clinician', specialty: 'Adult · couples · faith integration · clinical consult', url: 'https://tlctherapysolutions.me/christina-poe', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---christina-poe-AR01LXjXPBFJOGxN.jpg' },
  { name: 'Sheronda Smith-Williams', role: 'Specialist', specialty: 'Multicultural therapy · individual & family', url: 'https://tlctherapysolutions.me/sheronda-smith-williams', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---sheronda-smith-williams-ALp2egQZ9wS64pPW.jpg' },
  { name: 'Carolyn Nicole Johnson', role: 'Specialist', specialty: 'Child & adolescent · trauma-informed', url: 'https://tlctherapysolutions.me/carolyn-nicole-johnson', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---nicole-johnson-AR01N41P9Es3Xrb8.png' },
  { name: 'Candace Godbolt', role: 'Specialist', specialty: 'Multicultural therapy', url: 'https://tlctherapysolutions.me/candace-godbolt', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---candace-godbolt-m7VDvBz2n5te0wrl.jpeg' },
  { name: 'Wamaitha Sullivan', role: 'Specialist', specialty: 'Multicultural therapy', url: 'https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/headshot---wamaitha-sullivan-dJoPzQZMVaIJMPKW.jpg' },
  { name: 'Dr. Candace Gwin', role: 'Specialist', specialty: 'Clinical specialty services', url: 'https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---dr-candace-gwin-YD0ElbPRqnHxZqlv.jpg' },
  { name: 'Carileigh Jones', role: 'Specialist', specialty: 'Multicultural therapy', url: 'https://tlctherapysolutions.me/find-your-therapist-flexible-career-opportunities-african-american-women-men-multicultural-illinois-communities', photo: 'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=200,h=200,fit=crop/YBgjBp7R8bTV8wvZ/website---headshot---carileigh-jones-m7VD3Xex4RUPGEwn.jpg' },
];

export const TLC_INSURANCE =
  'Blue Cross Blue Shield · Aetna · United Health Care · Veterans Affairs · Cigna · Self-pay rates available';

// The public brand line + the two real client actions (book, learn more). The
// booking link is TLC's live Acuity scheduler; the website is their live site.
// One source so the operator Practice tab AND the client door never drift.
export const TLC_BRAND = {
  name: 'TLC Therapy Solutions',
  tagline: 'Real Solutions for Real Life.',
  blurb: 'Faith-integrated therapy. Online & in-person. Christina Poe, LCSW + clinical team.',
  website: 'https://tlctherapysolutions.me',
  bookingUrl: 'https://tlctherapysolutions-scheduleappointment.as.me/',
};

// The services a client can book — the SAME list the Practice tab shows, lifted
// here so the client door renders one record, not a copy that drifts.
export const TLC_SERVICES = [
  { name: 'Individual Therapy', desc: 'One-on-one · adult', for: 'Anxiety · depression · grief · life transitions · faith integration' },
  { name: 'Couples Therapy', desc: 'Marriage & relationships', for: 'Communication · conflict · pre-marital · rebuilding trust' },
  { name: 'Family Therapy', desc: 'Multi-generation work', for: 'Parent-child · sibling dynamics · blended families' },
  { name: 'Child & Adolescent', desc: 'Ages 6-17', for: 'Anxiety · school refusal · behavioral · trauma · identity' },
  { name: 'Group Therapy', desc: 'Themed cohort groups', for: 'Connection-based healing · processing in community' },
  { name: 'Clinical Consultation', desc: 'For pastors & professionals', for: 'Referral guidance · faith-clinical integration · supervision' },
];
