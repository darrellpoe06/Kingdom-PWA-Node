// =============================================================================
// THE ADVERTISED LINK OPENS THE DOOR IT ADVERTISES (DR-0958)
// =============================================================================
// Darrell, 2026-10-11, holding two screens side by side: the app's own SHARE
// POE PROPERTIES panel saying "OR SHARE THIS LINK: poetech.us/properties/app",
// and the thing that link actually gave him — "Create your profile … a 6-digit
// PIN". His words: "Wrong link for advertising?!!!!!!!!!"
//
// WHAT WAS TRUE. /properties/app/index.html is a whole page that exists for one
// reason: to be the Poe Properties face in its own scope, with its own
// manifest, its own icon and its own install identity. It loads /src/main.jsx
// with NO query string. main.jsx booted that face only on
// `__params.get('properties') === '1'`, so the bare path fell through every
// branch to the default one — the monolith, the private PoeTech gate, the PIN
// form.
//
// So the link the app hands out for advertising was the one link that did not
// open the thing being advertised. PROPERTIES_SHARE_URL and the QR encode that
// exact path, and so does every card already printed.
//
// THE FIX IS THE PATH, NOT THE LINK. Changing the share string to carry
// `?properties=1` would fix what is printed next and nothing already in the
// world. The path itself now boots the door; the param still works for every
// link that already carries it.
//
// PROVEN-TO-CATCH: reverting either arm of the predicate fails here, and so
// does declaring it after `__standalone` reads it — which is a real mistake
// made while writing this, and a temporal-dead-zone crash at module load.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(HERE, rel), 'utf8');
const MAIN = read('../main.jsx');
const DOOR_HTML = read('../../properties/app/index.html');

// main.jsx is a boot script with module-level side effects, so it cannot be
// imported here. The behaviour below is therefore exercised against a COPY of
// its predicate — and a copy proves nothing unless the original is pinned to
// match it, which the "the predicate in main.jsx is the strict one" case does.
// Without that pin, loosening main.jsx to startsWith('/properties') would keep
// every case here green while /properties-for-sale started booting the door.
const PREDICATE = /^\/properties(\/|$)/;
const onPropertiesPath = (pathname) => PREDICATE.test(pathname || '');

describe('the path alone opens the Poe Properties door', () => {
  it('the advertised link, exactly as the share panel prints it', () => {
    // poetech.us/properties/app — no query string, which is the whole point.
    expect(onPropertiesPath('/properties/app')).toBe(true);
    expect(onPropertiesPath('/properties/app/')).toBe(true);
    expect(onPropertiesPath('/properties')).toBe(true);
    expect(onPropertiesPath('/properties/')).toBe(true);
  });

  it('and does not swallow paths that merely begin with the same letters', () => {
    expect(onPropertiesPath('/properties-for-sale')).toBe(false);
    expect(onPropertiesPath('/propertiesx')).toBe(false);
    expect(onPropertiesPath('/')).toBe(false);
    expect(onPropertiesPath('/moore/app/')).toBe(false);
    expect(onPropertiesPath('')).toBe(false);
  });
});

describe('main.jsx wires it where it matters', () => {
  it('the door branch tests the predicate, not the raw param', () => {
    expect(MAIN).toMatch(/\} else if \(__isPropertiesDoor\) \{/);
    expect(MAIN).toMatch(/const __isPropertiesDoor = __params\.get\('properties'\) === '1' \|\| __onPropertiesPath;/);
  });

  it('the standalone list uses it too, so the door does not load the alert layer', () => {
    expect(MAIN).toMatch(/\|\| __isPropertiesDoor\n/);
  });

  it('is DECLARED BEFORE the thing that reads it', () => {
    // A const used above its declaration is a temporal dead zone crash at
    // module load — the whole app, white screen. Made this exact mistake
    // while writing the fix; this is the gate for it.
    const decl = MAIN.indexOf('const __isPropertiesDoor =');
    const use = MAIN.indexOf('const __standalone =');
    expect(decl).toBeGreaterThan(-1);
    expect(use).toBeGreaterThan(-1);
    expect(decl, '__isPropertiesDoor must be declared before __standalone reads it').toBeLessThan(use);
  });

  it('the predicate in main.jsx is the strict one this file exercises', () => {
    // The copy above is only evidence if the original says the same thing.
    expect(MAIN).toContain(String(PREDICATE));
    expect(MAIN).not.toMatch(/startsWith\('\/properties'\)/);
  });

  it('the old param still works, because links already exist carrying it', () => {
    expect(MAIN).toContain("__params.get('properties') === '1'");
  });
});

describe('the page that link lands on', () => {
  it('really does carry no query string of its own', () => {
    // If this page ever started forcing the param itself the predicate would
    // be redundant — and this test would say so instead of going quiet.
    expect(DOOR_HTML).toContain('src="/src/main.jsx"');
    expect(DOOR_HTML).not.toContain('properties=1');
  });

  it('and is the Poe Properties face, not the family platform', () => {
    expect(DOOR_HTML).toContain('manifest-properties.webmanifest');
    expect(DOOR_HTML).toContain('<title>Poe Properties</title>');
  });
});
