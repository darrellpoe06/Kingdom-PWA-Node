// =============================================================================
// family-ministries — the ONE source for the family's real-world business facts
// =============================================================================
// DR-0139/REV-0031 static-data findings + DR-0121 (one source, no hand-kept
// duplicates): "7-clinician team" was typed in two places in PromoBanners and a
// third time in DevOps; "11 rentals" in two; the 77th National Assembly's
// identity lived in PromoBanners AND the Event Center seed. Duplicated literals
// drift independently — the exact class DR-0121 kills. These are REAL-WORLD
// facts with no live in-app source (the rentals ROWS are per-instance data a
// public marketing surface can't read), so the honest structure is: entered
// ONCE, here, each with its provenance and a re-verify date the family owns —
// and every surface derives from this module. A fact wrong here is wrong
// everywhere at once, which is exactly what makes it findable and fixable.
//
// HONESTY RULE: values are consolidated from the app's own shipped copy (the
// family's earlier declarations), not invented. When one changes in the real
// world (a clinician joins TLC, a rental is bought/sold), update it HERE and
// every surface follows. `reVerify` is the family's standing date to confirm
// the fact still holds (DR-0075 — nothing parked forever).
// =============================================================================

export const FAMILY_MINISTRIES = {
  tlc: {
    name: 'TLC Therapy Solutions',
    tagline: 'Real Solutions for Real Life · Faith-integrated therapy',
    clinicians: 7,
    insurers: ['BCBS', 'Aetna', 'UHC', 'VA', 'Cigna'],
    modes: 'online and in-person',
    bookingUrl: 'https://tlctherapysolutions-scheduleappointment.as.me/',
    source: 'family-declared in shipped copy; consolidated 2026-07-10',
    reVerify: '2026-10-01',
  },
  poeProperties: {
    name: 'Poe Properties LLC',
    rentals: 11,
    tagline: 'Quality rentals in Champaign-Urbana · Owner-managed',
    contact: 'mailto:contact@poetech.us?subject=Poe Properties Rental Inquiry',
    source: 'family-declared in shipped copy; consolidated 2026-07-10',
    reVerify: '2026-10-01',
  },
  colg: {
    name: 'The Church of the Living God',
    address: '312 E. Bradley Ave, Champaign IL',
    schedule: 'Sunday Worship 11AM · Wed Bible Study 1PM & 6PM',
    siteUrl: 'https://thechurchofthelivinggod.com',
    youtubeUrl: 'https://www.youtube.com/channel/UC821pJh7YR5llBNnWUJj-ZA',
    source: 'family-declared in shipped copy; consolidated 2026-07-10',
    reVerify: '2026-10-01',
  },
  assembly: {
    name: '77th National Assembly',
    theme: 'Reviving Faith, Restoring Hope, Rebuilding Communities',
    host: 'The Church of the Living God',
    infoUrl: 'https://www.thechurchofthelivinggod.com/77th-national-assembly.html',
    source: 'family-declared in shipped copy + Event Center seed; consolidated 2026-07-10',
    reVerify: '2026-10-01',
  },
};

// Composed lines every consumer renders identically (change once, true everywhere).
export function tlcClinicianLine() {
  const t = FAMILY_MINISTRIES.tlc;
  return `${t.clinicians}-clinician team`;
}
export function tlcInsurersLine() {
  return `Accepts ${FAMILY_MINISTRIES.tlc.insurers.join(', ')}`;
}
export function poePropertiesLine() {
  const p = FAMILY_MINISTRIES.poeProperties;
  return `${p.rentals} rental homes · Faith-led ownership · Community-rooted`;
}
