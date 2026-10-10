// =============================================================================
// THE READER'S COLOR PICKER REACHES EVERY DOOR
// =============================================================================
// Darrell, 2026-10-10, inside Poe Properties: "can't change the color of the
// system using the reader controller... fix it".
//
// WHAT WAS TRUE, and why it read as a broken picker when the picker was fine.
// The theme is one shared preference: setThemePref writes it and publishes to
// every subscriber, and useThemePref both subscribes and saves. The PoeTech
// shell (poe-financial-mvp-v28.jsx:1082) used useThemePref and therefore
// repainted the moment the reader's picker was tapped.
//
// The three DOORS did not. Each held a private copy —
//
//     const [theme, setTheme] = useState(() => readThemePref('cream'));
//     useEffect(() => { saveThemePref(theme); }, [theme]);
//
// — which reads the value ONCE at mount and has no way to learn it changed.
// So inside a door the picker genuinely set the preference, the preference was
// genuinely saved, and the screen never repainted. Whether "the reader can
// change the system" depended entirely on which door you were standing in,
// which is why it read as an intermittent fault rather than a missing
// subscription.
//
// This pins the SUBSCRIPTION, not the colors: a door that reads the
// preference once can never be correct, however the palette changes.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(HERE, '..', 'components', f), 'utf8');

// Every surface that paints `data-theme` from the shared preference.
const DOORS = ['PropertiesDoor.jsx', 'TlcPublicDoor.jsx', 'MooreDoor.jsx'];

describe('every door hears the shared theme, not a copy of it', () => {
  for (const f of DOORS) {
    it(`PROVEN-TO-CATCH: ${f} subscribes instead of reading once`, () => {
      const src = read(f);
      // The exact shape that could not hear a change. Its presence is the bug.
      expect(
        src,
        `${f} holds a private theme copy; the reader's picker cannot reach it`,
      ).not.toMatch(/useState\(\(\)\s*=>\s*readThemePref\(/);
      expect(src).toContain("useThemePref('cream')");
    });

    it(`${f} no longer saves the theme by hand — useThemePref does it`, () => {
      // Two writers for one preference is how they drift apart.
      expect(read(f)).not.toMatch(/saveThemePref\(theme\)/);
    });
  }

  it('the PoeTech shell was already right, and stays right', () => {
    const shell = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toContain("useThemePref('cream')");
  });
});

describe('the primitive the doors now depend on', () => {
  const lib = readFileSync(join(HERE, '..', 'lib', 'theme-css.js'), 'utf8');

  it('useThemePref subscribes, so a change anywhere reaches here', () => {
    expect(lib).toContain('subscribeThemePref(setTheme)');
  });

  it('useThemePref also persists, which is why the hand-written effect went', () => {
    expect(lib).toContain('setTheme(setThemePref(next))');
  });
});
