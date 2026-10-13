// @vitest-environment node
// store-keystore-documented — the signing identity is documented where a person
// under pressure would look for it.
//
// WHY THIS EXISTS. Measured 2026-09-19: `store/android.keystore.enc` is the REAL
// store signing key for all five brand packages, and `store/README.md` — the one
// file named "how to get the app into the stores" — did not mention it. Its
// "Files here" list named the two templates and stopped. The custody model, the
// rotation path and the consequence of losing the passphrase existed only inside
// a comment in `.github/workflows/android-package.yml`.
//
// That is the failure class DR-0227 names: a constraint that everyone believes
// is held because a decision record says so, while the lane quietly does
// something else. DR-0152 still carried "the CI debug key is NOT the release
// key" eight weeks after the lane started committing the store key. A drift note
// now sits on that DR; this gate keeps the README honest going forward.
//
// THE CHECK IS DERIVED, not a copy: it reads whether the keystore FILE exists
// and requires the README to cover it. Delete the file and the requirement
// lifts; add it back and the requirement returns. A gate that merely asserted
// "the README contains the word keystore" would pass forever on a stale file.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../..');
const KEYSTORE = join(repoRoot, 'store', 'android.keystore.enc');
const README = join(repoRoot, 'store', 'README.md');

const keystoreExists = existsSync(KEYSTORE);
const readme = existsSync(README) ? readFileSync(README, 'utf8') : '';
const flat = readme.replace(/\s+/g, ' ');

describe('the committed signing key is documented beside itself', () => {
  it('the premise still holds — there is a committed keystore to document', () => {
    // The guard on the guard. If this ever goes false the rest of the file is
    // vacuous, and a vacuously-passing gate is the thing DR-0076 §3 forbids.
    expect(keystoreExists, 'store/android.keystore.enc no longer exists — this gate needs revisiting, not deleting').toBe(true);
  });

  it('README names the keystore file at all', () => {
    expect(flat).toMatch(/android\.keystore\.enc/);
  });

  it('says plainly that it is the real signing identity, not a throwaway', () => {
    // The specific misunderstanding this closes: DR-0152 called it a debug key.
    expect(flat).toMatch(/real store signing key|signing identity/i);
    expect(flat).toMatch(/Not a throwaway debug key|not a throwaway/i);
  });

  it('records how the owner pulls a custody copy', () => {
    // Custody that only exists in a workflow comment is not custody.
    expect(flat).toMatch(/openssl enc -d -aes-256-cbc -pbkdf2/);
    expect(flat).toMatch(/ANDROID_STORE_KEYSTORE_PASS/);
  });

  it('states the irreversible consequence of losing it', () => {
    // packageId is permanent after first upload (DR-0152) — the identity
    // cannot be re-minted, so the backup is the whole safety net.
    expect(flat).toMatch(/can never be updated again|permanent after first upload/i);
  });

  it('records the rotation path AND its cutoff', () => {
    // Rotation is cheap before the first Play upload and a different problem
    // after it. A README that gave the recipe without the cutoff would be a
    // trap rather than a runbook.
    expect(flat).toMatch(/Rotation/i);
    expect(flat).toMatch(/before the first Play upload/i);
  });

  it('carries the public-repository consideration with its re-review date', () => {
    expect(flat).toMatch(/publicly copyable|repository is public/i);
    expect(flat).toMatch(/re-review: 2026-10-03/);
  });
});
