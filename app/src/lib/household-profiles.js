// =============================================================================
// household-profiles — a parent adds & manages a child's profile (DP 2026-07-12)
// =============================================================================
// "How do I add my son to the Love Corner App?" There was no way. This is the
// engine for a PARENT-MANAGED child profile: the parent (already signed in) adds
// a child under their household and switches the active learner — the child does
// NOT get their own login (best practice + COPPA for young children: the parent
// governs, and a 6-year-old shouldn't hold credentials). The child's AGE BAND
// sets the Learn pace (CHILD 6-10 ... SENIOR 65+ — the same bands the Learn tab
// shows), so lessons come at the right depth for whoever is learning.
//
// MINOR PROTECTION (binding, from the governance/COPPA research): a child profile
// stores ONLY a first name + an age band. NEVER a minor's last name, phone,
// email, or address. Nothing about a child is shared outward or aggregated
// (DATA-EMPOWERMENT). PURE + deterministic; the UI + the parent-only doc-rail
// that persist these build on this.
// =============================================================================

// The age bands the Learn tab uses, each mapping to its lesson pace. `pace` is
// the value the Learn surface already understands ('child'|'youth'|'teen'|
// 'standard'|'senior'); label is what the parent sees.
export const AGE_BANDS = [
  { id: 'child',  label: 'Child',           range: '6–10',  pace: 'child' },
  { id: 'youth',  label: 'Youth',           range: '11–14', pace: 'youth' },
  { id: 'teen',   label: 'Teen',            range: '15–17', pace: 'teen' },
  { id: 'adult',  label: 'Adult',           range: '18–64', pace: 'standard' },
  { id: 'senior', label: 'Senior / Founding', range: '65+', pace: 'senior' },
];

export function ageBand(id) {
  return AGE_BANDS.find((b) => b.id === id) || null;
}

// The Learn pace for a child profile — so adding a child at CHILD 6-10 sets their
// lessons to the child pace automatically (no separate step).
export function paceForBand(bandId) {
  const b = ageBand(bandId);
  return b ? b.pace : 'standard';
}

// A first name only — trim, collapse whitespace, cap length. We deliberately do
// NOT accept or store a minor's last name / contact info.
function cleanFirstName(v) {
  return String(v || '').replace(/\s+/g, ' ').trim().slice(0, 40);
}

// Validate + normalize a child a parent is adding. Returns { ok, child } or
// { ok:false, errors }. `firstName` + `bandId` are all that's required; anything
// contact-like is intentionally not part of the shape (minor protection).
export function makeChildProfile(input = {}) {
  const errors = [];
  const firstName = cleanFirstName(input.firstName ?? input.name);
  const band = ageBand(input.bandId);
  if (!firstName) errors.push('a first name is required');
  if (!band) errors.push('choose an age (Child, Youth, Teen, Adult, or Senior)');
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    child: {
      kind: 'child-profile',
      firstName,
      bandId: band.id,
      pace: band.pace,
      // No last name, phone, email, or address — by design (COPPA / DATA-EMPOWERMENT).
    },
  };
}

// The household's child profiles from the raw list (defensive: only well-formed
// child-profile rows, deduped by lowercased first name + band so a double-add
// can't create two "Junior · Child" rows).
export function listChildren(profiles = []) {
  const seen = new Set();
  const out = [];
  for (const p of profiles || []) {
    if (!p || p.kind !== 'child-profile') continue;
    const key = `${String(p.firstName || '').toLowerCase()}|${p.bandId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

// Is a name already a child in this household? (so the UI can say "already added"
// instead of silently duplicating).
export function childExists(profiles = [], firstName, bandId) {
  const key = `${cleanFirstName(firstName).toLowerCase()}|${bandId}`;
  return listChildren(profiles).some((p) => `${String(p.firstName).toLowerCase()}|${p.bandId}` === key);
}
