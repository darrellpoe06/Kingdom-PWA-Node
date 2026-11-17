// A KEYLESS WITNESS MUST NOT WAIT ON A KEY (DR-1513, DR-0108 Ways review).
// =============================================================================
// WHAT HAPPENED. nas-health.yml holds the only outside-in probe of poetech.us
// this team can run -- the sandbox has no route to the site (DR-0125), so a
// GitHub runner is the outside eye. Every command in that step is a plain curl
// over the public internet: no ssh, no tailscale, no tailnet address.
//
// It had been placed AFTER "Verify the tailnet actually joined", which exits 1
// on a dead TS_AUTHKEY. So from 2026-11-04, when that key was refused, a dead
// NETWORK key silently took the team's KEYLESS eye with it: nas-health could
// not say whether the site was answering, for a reason that had nothing to do
// with the site or with the question being asked. The step ORDER was the whole
// cause. This is the DR-0108 failure shape exactly -- a stated "we cannot
// reach it" that was never a reach problem.
//
// WHAT THIS GUARDS -- not the curl commands (they change as the hops change),
// but the structural property that made the outage invisible:
//   1. the keyless step comes BEFORE any tailnet join;
//   2. it carries no `if:`, so the secrets gate cannot be reattached;
//   3. it STAYS keyless -- no ssh, tailscale or private address may creep in,
//      because the moment one does, 1 and 2 are false in substance while still
//      passing a position check. That is why the body is read, not only the
//      order.
//
// Read as TEXT on purpose. The property is about the order of blocks in the
// file and whether an `if:` line sits inside one, which the raw document states
// directly; no YAML parser is added to the app for one test.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const FILE = join(ROOT, '.github', 'workflows', 'nas-health.yml');

const STEP = /^ {6}- name: (.*)$/gm;
const OUTSIDE_IN = /^Outside-in transport proof/;
const NEEDS_NETWORK = /join-tailnet|tailscale|\bssh\b|\b100\.\d+\.\d+\.\d+|\b192\.168\.\d+\.\d+/;

/** Every `- name:` step of the file, in document order, with its own block.
 *
 * `code` is the block with YAML/shell comment lines removed. Scanning for a
 * network dependency has to read code and not prose: the first draft of this
 * test failed on the fixed workflow because the comment explaining that the
 * step uses "no ssh, no tailscale" contains both words. A guard that fires on
 * its own documentation would teach people to delete the documentation. */
export function steps(text = readFileSync(FILE, 'utf8')) {
  const heads = [...text.matchAll(STEP)].map((m) => ({ name: m[1].trim(), at: m.index }));
  return heads.map((h, i) => {
    const block = text.slice(h.at, i + 1 < heads.length ? heads[i + 1].at : text.length);
    return {
      ...h,
      block,
      // The `- name:` line goes too, for the same reason: "Check out (the
      // join-tailnet action lives in this repo)" needs no network at all, and
      // scanning its title said otherwise. Only `uses:`/`run:` content counts.
      code: block
        .split('\n')
        .slice(1)
        .filter((l) => !/^\s*#/.test(l))
        .join('\n'),
    };
  });
}

/** The `if:` of a step block, or null when it carries none. */
export function ifOf(block) {
  const m = block.match(/^ {8}if: (.*)$/m);
  return m ? m[1].trim() : null;
}

describe('the keyless outside eye does not wait on a network key', () => {
  const all = steps();
  const eye = all.findIndex((s) => OUTSIDE_IN.test(s.name));

  it('the outside-in probe is still in nas-health', () => {
    expect(eye, 'the outside-in step was renamed or removed').toBeGreaterThan(-1);
  });

  it('nothing that needs the private network runs before it', () => {
    const early = all.slice(0, eye).filter((s) => NEEDS_NETWORK.test(s.code));
    expect(
      early.map((s) => s.name),
      'a step needing the tailnet was put BEFORE the keyless probe again: a dead ' + 'TS_AUTHKEY ends that job and takes the outside eye with it (DR-1513)'
    ).toEqual([]);
  });

  it('it is not gated on the key secrets it does not use', () => {
    expect(
      ifOf(all[eye].block),
      'the keyless probe must carry no `if:` -- the gate it had checked that ' + 'TS_AUTHKEY and NAS_SSH_KEY were PRESENT, neither of which it needs'
    ).toBeNull();
  });

  it('it stays keyless: no ssh, tailscale or private address in its body', () => {
    const leaks = [
      [/\bssh\b/, 'ssh'],
      [/\btailscale\b/, 'tailscale'],
      [/\b100\.\d+\.\d+\.\d+/, 'a tailnet 100.x address'],
      [/\b192\.168\.\d+\.\d+/, 'a LAN address'],
    ]
      .filter(([re]) => re.test(all[eye].code))
      .map(([, what]) => what);
    expect(leaks, 'the keyless probe grew a dependency on the private network; put that work ' + 'in a gated step below instead (DR-1513)').toEqual([]);
  });

  it('it really is the outside-in probe of the live site', () => {
    expect(all[eye].code).toMatch(/curl[^\n]*https:\/\/poetech\.us/);
  });

  it('the steps that DO need the tailnet keep their own gate', () => {
    const gated = all.filter((s, i) => i > eye && /^(Join the tailnet|Verify the tailnet|Observe)/.test(s.name));
    expect(gated.map((s) => s.name).length, 'the ssh-side steps vanished').toBeGreaterThanOrEqual(3);
    for (const s of gated) {
      expect(ifOf(s.block), `${s.name} lost its secrets gate`).toBe("steps.gate.outputs.go == 'true'");
    }
  });

  // PROVEN TO CATCH (DR-0076 section 3). A gate that cannot fail is theatre, so
  // the exact arrangement this record exists to stop is replayed against a
  // synthetic document, through the SAME readers the live assertions use.
  describe('proven to catch the arrangement that hid the outage', () => {
    const JOIN = ['      - name: Join the tailnet (ephemeral)', '        uses: ./.github/actions/join-tailnet'];
    const eyeStep = (gate) => [
      '      - name: Outside-in transport proof (the runner IS the outside)',
      ...(gate ? [`        if: ${gate}`] : []),
      '        run: curl -sS https://poetech.us/sb/auth/v1/health',
    ];
    const doc = (lines) => ['jobs:', '  observe:', '    steps:', ...lines].join('\n');

    it('catches the join being moved back in front of the probe', () => {
      const s = steps(doc([...JOIN, ...eyeStep(null)]));
      const at = s.findIndex((x) => OUTSIDE_IN.test(x.name));
      const early = s.slice(0, at).filter((x) => NEEDS_NETWORK.test(x.code));
      expect(early.map((x) => x.name)).toEqual(['Join the tailnet (ephemeral)']);
    });

    it('passes the fixed order, so the catch above is not vacuous', () => {
      const s = steps(doc([...eyeStep(null), ...JOIN]));
      const at = s.findIndex((x) => OUTSIDE_IN.test(x.name));
      expect(s.slice(0, at).filter((x) => NEEDS_NETWORK.test(x.code))).toEqual([]);
    });

    it('catches the secrets gate being put back on the probe', () => {
      const s = steps(doc([...eyeStep("steps.gate.outputs.go == 'true'"), ...JOIN]));
      const at = s.findIndex((x) => OUTSIDE_IN.test(x.name));
      expect(ifOf(s[at].block)).toBe("steps.gate.outputs.go == 'true'");
    });

    it('catches ssh creeping into the probe body', () => {
      const s = steps(doc(['      - name: Outside-in transport proof (the runner IS the outside)', '        run: ssh nas "docker ps"']));
      expect(/\bssh\b/.test(s[0].code)).toBe(true);
    });
  });
});
