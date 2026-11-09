// =============================================================================
// join-tailnet — one door onto the tailnet, and it must stay one (DR-1374)
// =============================================================================
// Every tailnet join in this repo goes through `.github/actions/join-tailnet`,
// which prefers a NON-EXPIRING Tailscale OAuth client and falls back to the
// legacy auth key. That shape exists because 68 join sites across 64 workflows
// each passed `secrets.TS_AUTHKEY` directly, and an auth key expires by design,
// so one expiry shut 68 roads at once — measured again on 2026-11-06 when
// `inbox-lessons-waiting.yml` run 42291051232 failed at "Verify the tailnet
// actually joined" (DR-1269 and DR-1284 each recorded an earlier instance).
//
// THESE CASES ARE THE RATCHET. A mechanical edit over 68 sites is only safe
// because the properties are asserted over the WHOLE set rather than sampled,
// and the first pass of that edit really did break a file: it dropped the `- `
// list marker at the `- uses:` shape and left `transcript-backfill.yml` invalid,
// a file that parsed fine beforehand. A YAML parse of all of them caught it in
// seconds. Without these cases the next person to add a workflow reaches for
// `tailscale/github-action@` again and the expiry comes back.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// NO YAML LIBRARY IS VENDORED HERE, and one is not added for a test: the repo's
// own convention for reading workflows is text scanning (scripts/workflow-
// register.mjs does the same). The job-boundary scan below was cross-checked
// against a real YAML parse while DR-1374 was built -- both reported the same
// 68 join sites and the same 21 lacking a checkout, which is why a text scan is
// trusted for this property.

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const WF = join(REPO, '.github', 'workflows');
const ACTION = join(REPO, '.github', 'actions', 'join-tailnet', 'action.yml');
const DOOR = './.github/actions/join-tailnet';

const files = readdirSync(WF)
  .filter((f) => f.endsWith('.yml'))
  .sort();
const read = (f) => readFileSync(join(WF, f), 'utf8');

/** A workflow's job keys sit at exactly two spaces of indentation. */
const JOB_KEY = /^ {2}([A-Za-z0-9_-]+):\s*$/;

/** Every (file, job) that joins the tailnet, and whether a checkout preceded it. */
function joinSites() {
  const out = [];
  for (const f of files) {
    let job = '(top)';
    let checkedOut = false;
    for (const line of read(f).split('\n')) {
      const k = JOB_KEY.exec(line);
      if (k) {
        job = k[1];
        checkedOut = false;
        continue;
      }
      if (line.includes('actions/checkout')) checkedOut = true;
      if (line.includes(DOOR)) out.push({ file: f, job, checkedOut });
    }
  }
  return out;
}

describe('join-tailnet — one door (DR-1374)', () => {
  // THE BREAK THE CONVERSION ACTUALLY CAUSED. Rebuilding the block at the
  // `uses:` line's own indentation drops the `- ` marker at the `- uses:` shape,
  // which left transcript-backfill.yml with a step that is not a list item --
  // a file that parsed fine before. Without a library, the structural tell is
  // that the door's `uses:` must either carry the dash itself or sit under a
  // sibling key of a step that has one.
  it('every join site is a well-formed step, with its list marker intact', () => {
    const broken = [];
    for (const f of files) {
      const L = read(f).split('\n');
      L.forEach((line, i) => {
        if (!line.includes(DOOR)) return;
        const m = /^(\s*)(-\s+)?uses:/.exec(line);
        if (!m) return; // a mention in a comment, not a step
        if (m[2]) return; // carries its own dash: fine
        // Otherwise the step's own list marker opens it TWO SPACES SHALLOWER
        // (the `- ` itself is those two characters), e.g. `      - name:` above
        // `        uses:`. Getting this arithmetic wrong is how the first
        // version of this case flagged 67 of 68 sound files -- the measurement
        // was wrong, not the workflows, and the YAML parse run while DR-1374
        // was built is what proved which.
        const indent = m[1].length;
        const dashAt = new RegExp(`^ {${Math.max(indent - 2, 0)}}-\\s`);
        let ok = false;
        for (let j = i - 1; j >= 0 && j > i - 12; j -= 1) {
          if (dashAt.test(L[j])) {
            ok = true;
            break;
          }
          // Reaching a shallower key means the step was never opened.
          if (/^\s*\S/.test(L[j]) && /^ {0,3}\S/.test(L[j])) break;
        }
        if (!ok) broken.push(`${f}:${i + 1}`);
      });
    }
    expect(broken, `these join steps lost their list marker: ${broken.join(', ')}`).toEqual([]);
  });

  // THE REGRESSION THIS EXISTS TO STOP. A new workflow that reaches straight for
  // the upstream action is a road that dies on the next key expiry.
  it('no workflow uses tailscale/github-action directly', () => {
    const direct = files.filter((f) => read(f).includes('tailscale/github-action@'));
    expect(direct, `these bypass the one door (${DOOR}) and will die on the next auth-key expiry: ${direct.join(', ')}`).toEqual([]);
  });

  it('the door exists, prefers OAuth, falls back to the auth key, and verifies the join', () => {
    expect(existsSync(ACTION)).toBe(true);
    const src = readFileSync(ACTION, 'utf8');
    for (const input of ['oauth-client-id:', 'oauth-secret:', 'authkey:', 'tags:']) {
      expect(src, `the door must take ${input}`).toContain(input);
    }
    // Two mutually exclusive joins, each gated on which ticket is held.
    expect(src).toMatch(/if:\s*steps\.pick\.outputs\.credential == 'oauth'/);
    expect(src).toMatch(/if:\s*steps\.pick\.outputs\.credential == 'authkey'/);
    // The join step's own conclusion is not a witness of the join (DR-1284), so
    // the door must carry a verify STEP. Asserted on the step name, not on the
    // file: the first version of this case searched the whole file and passed
    // while the step was renamed away, because the header COMMENT quotes the
    // same phrase. A scanner that reads prose as code finds what the prose
    // promises -- the second time that exact trap bit me today.
    expect(src, 'the join must be verified, not assumed').toMatch(/^\s*-\s+name:.*Verify the tailnet actually joined/m);
    expect(src, 'a missing credential must fail loudly rather than join nothing').toMatch(/credential=none/);
  });

  // A LOCAL COMPOSITE ACTION CANNOT BE READ WITHOUT A CHECKOUT. Measured before
  // the conversion: 21 of 68 sites had none, and converting them blind would
  // have silently broken 21 workflows, most of them health probes.
  it('every join site checks out the repo first, or it cannot read the door', () => {
    const sites = joinSites();
    expect(sites.length, 'the door should be in use across the estate').toBeGreaterThanOrEqual(60);
    const blind = sites.filter((s) => !s.checkedOut).map((s) => `${s.file}:${s.job}`);
    expect(blind, `these join before any checkout, so ${DOOR} will not exist: ${blind.join(', ')}`).toEqual([]);
  });

  it('the door never prints either credential', () => {
    const src = readFileSync(ACTION, 'utf8');
    // A value would have to be interpolated or echoed; only NAMES may appear.
    const leaks = src
      .split('\n')
      .map((l, i) => ({ l, n: i + 1 }))
      .filter(({ l }) => /echo|printf/.test(l))
      .filter(({ l }) => /\$\{\{\s*(inputs|secrets)\.(authkey|oauth-secret|oauth-client-id)/i.test(l) || /\$(AUTHKEY|OAUTH_SECRET)\b/.test(l))
      .map(({ n, l }) => `${n}: ${l.trim()}`);
    expect(leaks, `these lines could print a credential: ${leaks.join(' | ')}`).toEqual([]);
    expect(src, 'any tskey- in output is redacted').toContain('tskey-REDACTED');
  });
});
