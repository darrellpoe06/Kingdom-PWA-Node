// =============================================================================
// The witness watches the door that is there (DR-0964)
// =============================================================================
// On 2026-10-11 the deploy workflow went red on TWO consecutive merges
// (runs 1615 on e6d75403 and 1616 on eccda88b) with:
//
//   BOOT FAIL https://poetech.us/poetech-app/ — app did not mount within 30s
//   (no mount marker; body 462 chars): "POE PROPERTIES — PLACES TO LIVE
//    2 places available ... No account needed to look. Champaign, Illinois."
//
// The app had mounted. That body IS the front door, rendering correctly, and
// `?moore=1` and `?view=church` both read BOOT OK in the very same run. What
// failed was the witness: `MOUNT_MARKERS` named `'Create your profile'` — the
// heading of the PIN form Darrell photographed that morning and told us to
// remove. DR-0958 removed it, and the instrument watching the signed-out root
// was still looking for it. The witness was pinned to the defect, and
// deleting the defect is what turned the deploy red.
//
// Two separate faults, both proven here:
//   1. the marker list named a SCREEN that no longer exists;
//   2. adding the new heading literally would ALSO have failed, because
//      boot-check reads `document.body.innerText` and Chrome applies CSS
//      `text-transform` to it — the heading carries `uppercase`, which is why
//      the failure log printed it in capitals.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../../scripts/boot-markers.mjs'), 'utf8');

// The exact body the browser returned on the failing run, copied from the log
// of run 38112398908 rather than retyped from the component.
const THE_REAL_FAILING_BODY = `POE PROPERTIES — PLACES TO LIVE
2 places available

No account needed to look. Champaign, Illinois.

PHOTOGRAPHS COMING
1-bed multi-family in Champaign, Illinois
$0/mo
Short stay welcome
BOOK A STAY —`;

// The markers now live in their own module precisely so this test can import
// them: boot-check.mjs pulls in playwright-core at module scope and cannot be
// loaded here at all. Burying the rule in an unimportable file is part of why
// it went unproven for as long as it did.
async function load() {
  const { hasMarker, MOUNT_MARKERS } = await import('../../../scripts/boot-markers.mjs');
  return { hasMarker, MOUNT_MARKERS };
}

describe('the mount markers know the door that production actually serves', () => {
  it('PROVEN-TO-CATCH: the real failing body is recognised as a healthy mount', async () => {
    const { hasMarker, MOUNT_MARKERS } = await load();
    expect(
      hasMarker(THE_REAL_FAILING_BODY, MOUNT_MARKERS),
      'the body that failed two deploys is still not recognised as a mount',
    ).toBe(true);
  });

  it('PROVEN-TO-CATCH: a literal compare does NOT recognise it — the fold is load-bearing', async () => {
    const { MOUNT_MARKERS } = await load();
    // This is the assertion that stops someone "simplifying" hasMarker back to
    // a plain includes(). Chrome's innerText is CSS-transformed; the source
    // string is sentence case. They do not meet without folding.
    expect(
      MOUNT_MARKERS.some((m) => THE_REAL_FAILING_BODY.includes(m)),
      'a literal compare now matches, so this test no longer proves the fold is needed',
    ).toBe(false);
  });

  it('the front door’s own heading is one of the markers, read from the component', async () => {
    // Pinned against the COMPONENT, not a copy, so changing the heading
    // without telling the witness fails here rather than on the next deploy.
    const door = readFileSync(join(here, '../components/PublicFrontDoor.jsx'), 'utf8');
    const m = door.match(/\n\s*(Poe Properties[^\n<]*)\n/);
    expect(m, 'PublicFrontDoor no longer carries a recognisable heading line').toBeTruthy();
    const heading = m[1].trim();
    const { hasMarker, MOUNT_MARKERS } = await load();
    expect(
      hasMarker(heading, MOUNT_MARKERS),
      `the front door now says "${heading}" and boot-check does not know it`,
    ).toBe(true);
  });

  it('every marker says which screen it is for, so a retired screen is visible', () => {
    // The root cause was a marker outliving its screen with nothing recording
    // what it was for. Each entry now carries that note.
    const list = src.slice(src.indexOf('export const MOUNT_MARKERS = ['), src.indexOf('];', src.indexOf('export const MOUNT_MARKERS = [')));
    const entries = list.split('\n').filter((l) => /^\s*'/.test(l));
    expect(entries.length, 'no markers found').toBeGreaterThan(2);
    for (const e of entries) {
      expect(e, `a marker with no note saying which screen it is for: ${e.trim()}`).toMatch(/\/\/\s*\S/);
    }
  });

  it('a genuinely blank page is still a failure — the fold did not weaken the gate', async () => {
    const { hasMarker, MOUNT_MARKERS } = await load();
    expect(hasMarker('', MOUNT_MARKERS)).toBe(false);
    expect(hasMarker('Almost there — one more tap', MOUNT_MARKERS)).toBe(false);
  });

  it('the recovery screens are still caught, folded the same way', async () => {
    const { hasMarker } = await load();
    expect(hasMarker('ALMOST THERE — ONE MORE TAP', ['Almost there — one more tap'])).toBe(true);
  });
});
