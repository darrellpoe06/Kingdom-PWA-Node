// @vitest-environment node
// =============================================================================
// REAL ESTATE SAYS WHETHER ITS DOOR IS LINKED
// =============================================================================
// Darrell, 2026-10-10, holding the two tabs side by side: "Does it interconnect
// to each other inside the appropriate locations? Images transferred to the
// Properties tab inside PoeTech... however not to the Real Estate tab.... data
// should be end to end workflows... make sense?"
//
// IT DOES INTERCONNECT, AND THE WIRE IS REAL. Rentals' PropertyGallery already
// merges five streams — room photos, maintenance shots, the NAS chat archive,
// the address's own NAS folder, and `loadCloudDoorPhotos(rental.remoteUuid)`,
// which is the Poe Properties door's own `property_photos` keyed by
// `rental_ref`. That merge was built for his 2026-09-08 ask ("upload these
// into the app inside of the property section as well as inside of the other
// section for rentals") and the code comment says so.
//
// IT HANGS ON ONE HINGE. `cloudRef = rental.remoteUuid || null` — the cloud
// rentals id that rentals-sync stamps onto a local record when it matches a
// remote row. Until that stamp exists cloudRef is null, the door query never
// runs, and not one door picture can appear.
//
// AND THE SURFACE PROMISED THEM ANYWAY. All three empty-state branches were
// keyed on the NAS status; none mentioned the link, and one said outright that
// "the pictures taken on its Poe Properties door ... all land here" — while
// they provably could not. A surface must not promise what it cannot deliver
// (DR-0076 §1) and must say what is missing and how to mend it (P15/DR-0381).
//
// THIS PINS the wire and the honesty together, because either alone is a lie:
// a merge nobody can see, or a notice over a merge that does not exist.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');
const codeOnly = (src) => String(src)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');

const RENTALS = read('components', 'Rentals.jsx');
const CODE = codeOnly(RENTALS);

describe('the wire from the door to Real Estate is real', () => {
  it('Real Estate reads the door’s own photos, keyed by the cloud rentals id', () => {
    expect(CODE).toContain('loadCloudDoorPhotos');
    expect(CODE).toMatch(/cloudRef\s*=\s*rental\.remoteUuid/);
  });

  it('and MERGES them into the one chronological strip, not a separate shelf', () => {
    // A door picture that loads but is never merged is the same as no wire.
    expect(CODE).toMatch(/for \(const p of cloud\)/);
    expect(CODE).toContain('Poe Properties · ');
    expect(CODE).toMatch(/\}, \[rental, nas\.photos, added, cloud, cloudFull\]\)/);
  });
});

describe('when the link is missing, the surface says so', () => {
  it('PROVEN-TO-CATCH: a notice exists and is shown exactly when there is no cloud id', () => {
    expect(CODE).toContain("data-testid=\"door-not-linked\"");
    // Guarded on the hinge itself, never on the NAS status, which is a
    // different fact about a different store.
    const guards = CODE.match(/\{!cloudRef && \(/g) || [];
    expect(guards.length, 'the notice must be guarded on cloudRef').toBeGreaterThanOrEqual(2);
  });

  it('it appears on BOTH the empty panel and the populated strip', () => {
    // A full-looking strip hides the missing door pictures better than an
    // empty one does, so the quiet case is the one that needed it most.
    const hits = CODE.match(/data-testid="door-not-linked"/g) || [];
    expect(hits.length).toBe(2);
  });

  it('it names the remedy, not just the fault', () => {
    expect(RENTALS).toMatch(/Sign in and\s+let Real Estate sync once|Sign in and let Real Estate sync once/);
    expect(RENTALS).toContain('Poe Properties door');
  });

  it('the old promise is no longer made unconditionally', () => {
    // The sentence may still stand in the branch where the door CAN deliver;
    // what must never happen again is that sentence with nothing beside it
    // when cloudRef is null. The notice is that "beside it".
    const promise = 'the pictures taken on its Poe Properties door';
    expect(RENTALS).toContain(promise);
    expect(RENTALS).toContain('cannot\n            appear here');
  });
});

// =============================================================================
// AND THE TENANCY CROSSES TOO
// =============================================================================
// Darrell, 2026-10-10: "Working?!!!!! Tenant information?" then "End to end?"
//
// MEASURED BEFORE BUILDING: Real Estate kept its own tenant object
// (rental.tenant) and referenced `rental_tenancies` ZERO times, while
// Start-the-tenancy on the Poe Properties door writes a full row there —
// lease start, rent, phone, email, the subsidised flag. None of it crossed;
// only a bare tenant_name string rode the rentals row. Two stores, one
// address, no wire.
//
// THE DOOR IS THE SYSTEM OF RECORD and this tab SHOWS it, read-only. Two
// writable copies of a real person's lease is how records get lost, and
// starting or ending one stays on the door (P68).
// =============================================================================
describe('a tenancy started on the door reaches Real Estate', () => {
  it('PROVEN-TO-CATCH: Real Estate reads the door’s tenancies at all', () => {
    expect(CODE).toContain('loadDoorTenancies');
  });

  it('keyed by the SLUG, which is what rental_tenancies.rental_ref holds', () => {
    // The uuid belongs to property_rooms and property_photos. Passing it here
    // matches nothing and renders an empty panel that reads as "no tenants" —
    // the measured 2026-08-27 defect class, and the quiet failure this whole
    // question was about.
    expect(CODE).toMatch(/tenancyRef\s*=\s*rental\.slug/);
    expect(CODE).not.toMatch(/loadDoorTenancies\(\s*rental\.remoteUuid/);
  });

  it('shows the fields the door actually captures, not just a name', () => {
    for (const f of ['tenant_name', 'lease_start', 'monthly_rent', 'tenant_phone', 'tenant_email', 'subsidised']) {
      expect(CODE, `${f} is not surfaced`).toContain(f);
    }
  });

  it('says so plainly when the door holds none — never a silent blank (P15)', () => {
    expect(CODE).toContain('data-testid="door-tenancies-none"');
    expect(RENTALS).toContain('No tenancy started on its Poe Properties door');
  });

  it('does NOT copy the door’s tenancy into the local tenant object', () => {
    // One writable record. saveLeaseTenant still writes only the local object;
    // nothing here feeds the door's row back into it.
    expect(CODE).not.toMatch(/setTenantForm\([^)]*doorTenancies/);
    expect(CODE).not.toMatch(/updateRental\([^)]*doorTenancies/);
  });
});
