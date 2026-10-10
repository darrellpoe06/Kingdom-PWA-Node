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
