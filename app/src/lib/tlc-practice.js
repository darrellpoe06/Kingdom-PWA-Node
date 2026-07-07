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
