// =============================================================================
// THE READER'S COLOR PICKER REACHES EVERY DOOR
// =============================================================================
// Darrell, 2026-10-10, inside Poe Properties: "can't change the color of the
// system using the reader controller... fix it".
//
// WHAT WAS TRUE, and why it read as a broken picker when the picker was fine.
// The theme is one shared preference: setThemePref writes it and publishes to
// every subscriber, and useThemePref both subscribes and saves. The PoeTech
// shell (the monolith:1082) used useThemePref and therefore
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

// Every surface that paints `data-theme` from the shared preference, with the
// fallback each one asks for. RETARGETED, NOT RELAXED (DR-1156, the same move
// DR-1060 made for the shell below): the TLC door now opens in TLC's own
// ivory & forest by its own fallback, so the exact string this pinned
// (`useThemePref('cream')`) moved for that one door. The guarantee this case
// holds — every door reads the preference THROUGH useThemePref and keeps no
// private copy — is unchanged; the fallback is simply named per door.
const DOORS = [
  ['PropertiesDoor.jsx', "useThemePref('cream')"],
  ['TlcPublicDoor.jsx', 'useThemePref(TLC_DEFAULT_THEME)'],
  ['MooreDoor.jsx', "useThemePref('cream')"],
];

describe('every door hears the shared theme, not a copy of it', () => {
  for (const [f, fallback] of DOORS) {
    it(`PROVEN-TO-CATCH: ${f} subscribes instead of reading once`, () => {
      const src = read(f);
      // The exact shape that could not hear a change. Its presence is the bug.
      expect(
        src,
        `${f} holds a private theme copy; the reader's picker cannot reach it`,
      ).not.toMatch(/useState\(\(\)\s*=>\s*readThemePref\(/);
      expect(src).toContain(fallback);
    });

    it(`${f} no longer saves the theme by hand — useThemePref does it`, () => {
      // Two writers for one preference is how they drift apart.
      expect(read(f)).not.toMatch(/saveThemePref\(theme\)/);
    });
  }

  it('the PoeTech shell was already right, and stays right (its fallback is the family app\'s DEFAULT_THEME, DR-1046)', () => {
    // RETARGETED, NOT RELAXED (DR-1060). This pinned the exact string
    // `useThemePref(DEFAULT_THEME)`, and DR-1060 made the fallback depend on
    // WHICH DOOR is open: the church's door opens in the church's own colors,
    // the family app still opens in Heritage. The guarantee this case actually
    // holds — the shell reads the preference through useThemePref and keeps no
    // private copy, and the FAMILY fallback is still DEFAULT_THEME — is
    // unchanged, so the check follows the change rather than being deleted.
    //
    // THIRD TIME THIS WEEK a second place pinned a line that moved, and only CI
    // knew: call-to-give-sync.js (DR-1057), feature-registry.json (DR-1056),
    // and now this. The habit both records name is the one that catches it —
    // when a line changes, search the whole tree for it, not the files being
    // edited.
    const shell = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/useThemePref\([^)]*DEFAULT_THEME\)/);
    // The family app's fallback is still Heritage's DEFAULT_THEME, and the
    // church's is its own — never the other way round.
    expect(shell).toContain(': DEFAULT_THEME)');
    expect(shell).toContain('CHURCH_DEFAULT_THEME :');
    expect(shell).not.toMatch(/useState\(\(\)\s*=>\s*readThemePref\(/);
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
