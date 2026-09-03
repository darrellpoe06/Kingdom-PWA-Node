// =============================================================================
// The standards we already meet elsewhere apply everywhere — gated
// =============================================================================
// Darrell, 2026-08-28, looking at the Properties picture form:
//   "review what we have built before building... we have multiple pictures
//    upload etc... options to add options to dropdowns... all these features
//    need to be applied as we build without needing to keep saying it....
//    our standards are higher than this build... we have intuitive SaaS."
//
// He is right, and the evidence was already in the repo. MEASURED before
// writing a line: `multiple` is on six image pickers we shipped —
//   LifeGallery.jsx, FeedbackCenter.jsx, ChurchObservation.jsx,
//   Rentals.jsx (room photos), Rentals.jsx (maintenance photos)
// — and the newest one, the Properties gallery, took ONE file. A person with
// twelve pictures of an apartment had to repeat the whole form twelve times.
//
// The fix for "stop making me say it" is not a better memory. It is a test.
// These read the real components, so a picker that regresses to single-file, or
// a dropdown that offers a person no way forward, fails the build instead of
// being found on his phone six weeks later.
//
// SCOPE, deliberately narrow. This governs pickers whose subject is naturally
// PLURAL (photographs of a property, of a room, of a piece of damage). A form
// that takes exactly one document, one spreadsheet, one statement, one profile
// image is not in breach and is listed by name below — a standard that fires on
// things it should not is noise, and noise is how a guard gets deleted.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === '__tests__' || name === 'node_modules') continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const rel = (p) => p.slice(SRC.length + 1);

// Every <input type="file"> in the app, with the file it lives in.
function filePickers() {
  const out = [];
  for (const p of files) {
    const src = readFileSync(p, 'utf8');
    const re = /<input\b[^>]*type="file"[^>]*>/gs;
    for (const m of src.matchAll(re)) out.push({ file: rel(p), tag: m[0] });
  }
  return out;
}

// A picker is IMAGE-ONLY when its accept list is images and nothing else.
const isImageOnly = (tag) => /accept="image\/\*"/.test(tag);

// Pickers that legitimately take exactly one image, with the reason. Adding a
// name here is a deliberate act with a justification, which is the point — the
// list is the argument, not an escape hatch.
const SINGULAR_BY_DESIGN = Object.freeze({
  'components/MooreDivahs.jsx': 'one piece, one photograph of it',
  'components/BooksTransactions.jsx': 'one receipt belongs to one transaction',
  'components/ChefCorner.jsx': 'one photo per recipe',
  'components/Choir.jsx': 'one attachment per song sheet',
});

describe('a picker for something plural takes more than one', () => {
  it('finds the image pickers at all, so this is never vacuously green', () => {
    const imagePickers = filePickers().filter((p) => isImageOnly(p.tag));
    expect(imagePickers.length).toBeGreaterThan(4);
  });

  it('every image picker either accepts many or is named as singular by design', () => {
    const offenders = filePickers()
      .filter((p) => isImageOnly(p.tag))
      .filter((p) => !/\bmultiple\b/.test(p.tag))
      .filter((p) => !SINGULAR_BY_DESIGN[p.file])
      .map((p) => p.file);
    expect(
      offenders,
      `these take one image where the subject is plural — add multiple, or name the file in SINGULAR_BY_DESIGN with a reason: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('the Properties gallery is one of the many — the case that prompted this', () => {
    const src = readFileSync(join(SRC, 'modules/properties/DoorTabs.jsx'), 'utf8');
    const tag = (src.match(/<input\b[^>]*accept="image\/\*"[^>]*>/s) || [''])[0];
    expect(tag).toContain('multiple');
  });
});

describe('a dropdown never leaves a person with nowhere to go', () => {
  // THE SECOND HALF of what he found: the ROOM dropdown on a door with no
  // rooms offered exactly one choice — "Not a specific room" — and no way to
  // make a room without abandoning the picture he had already chosen.
  const doorTabs = () => readFileSync(join(SRC, 'modules/properties/DoorTabs.jsx'), 'utf8');

  it('the room picker offers a way to add a room from where you are', () => {
    const src = doorTabs();
    expect(src).toContain('__add__');
    expect(src).toMatch(/Add a room/i);
  });

  it('and says so plainly when the door has none yet', () => {
    expect(doorTabs()).toMatch(/No rooms yet/i);
  });
});

// Pattern 2f applied to the Legacy Provisions form (DR-0323). Added because the
// checks below were PINNED to the two defects that prompted DR-0314 rather than
// swept across the app, so a new surface with a dead-end dropdown sailed past
// them — which is exactly what happened here on 2026-09-03.
//
// Why a pin and not a sweep: MEASURED before writing the rule (DR-0314's own
// discipline) — 207 selects in components/ render their options from a mapped
// array, and only 2 offer an in-place add. The other 205 overwhelmingly map
// FIXED vocabularies (status, month, category, kind) that can never be empty and
// need no add affordance. A blanket rule would file 205 findings, and noise is
// how a guard gets deleted (DR-0314 §3). The distinction that matters — "maps a
// user-created collection that can legitimately be empty" — is not decidable by
// regex, so each such form is pinned as it is built. The measurement is recorded
// in UX-PATTERNS.md so the next person does not re-derive it.
describe('the Legacy Provisions form inherits Pattern 2f', () => {
  const legacy = () => readFileSync(join(SRC, 'components/LegacyProvisions.jsx'), 'utf8');

  it('its beneficiary picker offers the way to fill itself, in place', () => {
    const src = legacy();
    expect(src).toMatch(/\+ Add a beneficiary/);
    expect(src).toMatch(/__add__/);
  });

  it('and says the roster is empty rather than looking like one considered option', () => {
    expect(legacy()).toMatch(/No beneficiaries yet/);
  });

  it('every disabled control on it states what it is waiting for', () => {
    const src = legacy();
    expect(src).toMatch(/Type a name to add/);        // the roster + inline add buttons
    expect(src).toMatch(/Choose a beneficiary first/); // the record button
  });
});

describe('a disabled control says why it is disabled', () => {
  // A greyed "Add to the gallery" with no sentence beside it is the app
  // refusing without explaining — the thing an intuitive product never does.
  it('the gallery form tells you what it is waiting for', () => {
    const src = readFileSync(join(SRC, 'modules/properties/DoorTabs.jsx'), 'utf8');
    expect(src).toMatch(/Choose (a picture|at least one picture)/i);
  });
});
