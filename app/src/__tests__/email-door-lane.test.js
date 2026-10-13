// @vitest-environment node
// =============================================================================
// The email door is wired by the lane; only MINTING the password is his
// =============================================================================
// Darrell 2026-09-16: "Email door!!!!!!!!?!!!!" / "what do you need from me?!!!"
//
// The honest split this lane encodes, so it cannot quietly drift back:
//   * Google mints an App Password behind 2-Step Verification on HIS account.
//     No SSH reaches that. It is a DR-0111 §2 value-only-he-holds, full stop.
//   * Everything after — writing it into the stack's .env, restarting GoTrue,
//     proving the door answers — is machine work, and asking him to SSH in and
//     type it at a prompt (which enable_email_smtp.sh required) was the
//     challengeable premise, not the credential itself (DR-0108).
//
// These pins keep the secret out of every log and out of both process lists,
// keep verify mode genuinely read-only, and keep a wired-but-shut door RED.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..');
const WF = join(ROOT, '.github/workflows/nas-email-door.yml');
const SH = join(ROOT, 'scripts/email-door-over-tailnet.sh');
const read = (p) => readFileSync(p, 'utf8');

describe('nas-email-door.yml — dispatchable, and it names the one missing value', () => {
  const wf = read(WF);

  it('exists and is dispatch-only', () => {
    expect(existsSync(WF)).toBe(true);
    expect(wf).toMatch(/^on:\s*\n\s+workflow_dispatch:/m);
    expect(wf).not.toMatch(/^\s+schedule:/m);
  });

  it('defaults to verify, so a careless dispatch cannot rewrite the door', () => {
    expect(wf).toMatch(/options:\s*\[verify,\s*wire\]/);
    expect(wf).toMatch(/default:\s*verify/);
  });

  it('tells him exactly how to supply the one value, when wire has nothing to write', () => {
    expect(wf).toMatch(/SMTP_APP_PASSWORD/);
    expect(wf).toMatch(/myaccount\.google\.com\/apppasswords/);
    expect(wf).toMatch(/New repository secret/);
    expect(wf).toMatch(/::error::SMTP_APP_PASSWORD secret is not set - nothing was changed/);
  });

  it('rides the proven remote-hands channel', () => {
    expect(wf).toMatch(/uses:\s*tailscale\/github-action@v3/);
    expect(wf).toMatch(/tailscale status --peers=false/);
    expect(wf).toMatch(/run:\s*bash scripts\/email-door-over-tailnet\.sh/);
  });
});

describe('the App Password never reaches a log or a process list', () => {
  const sh = read(SH);

  it('crosses to the NAS on STDIN, never in argv on either side', () => {
    expect(sh).toMatch(/printf '%s\\n' "\$AP_CLEAN"; cat "\$REMOTE_SCRIPT"/);
    expect(sh).toMatch(/read -r AP \|\| AP=""/);
    // The ssh command line carries only the mode and the sender.
    expect(sh).toMatch(/EMAIL_DOOR_MODE='\$MODE' EMAIL_DOOR_SENDER='\$SENDER' bash -s/);
  });

  it('is written by an awk -v binding, never as part of a sed pattern', () => {
    expect(sh).toMatch(/awk -v pass='\$AP' -v user='\$SENDER'/);
    expect(sh).not.toMatch(/sed[^\n]*\$AP\b/);
  });

  it('scrubs the secret from anything captured back on the runner', () => {
    expect(sh).toMatch(/OUT=\$\{OUT\/\/\$AP_CLEAN\/<app password>\}/);
    expect(sh).toMatch(/errtxt=\$\{errtxt\/\/\$AP_CLEAN\/<app password>\}/);
  });

  it('reports the door by PRESENCE only, never a value', () => {
    expect(sh).toMatch(/test -n "\$GOTRUE_SMTP_PASS" && echo yes \|\| echo no/);
    expect(sh).toMatch(/door BEFORE \(presence only\)/);
  });

  it('rejects a mis-pasted secret BEFORE touching the box', () => {
    expect(sh).toMatch(/\[ "\$\{#AP_CLEAN\}" -ne 16 \]/);
    expect(sh).toMatch(/::error::App Password is not 16 characters - nothing was changed/);
  });
});

describe('verify changes nothing, and a shut door never reads as open', () => {
  const sh = read(SH);

  it('verify mode exits before any write', () => {
    expect(sh).toMatch(/if \[ "\$MODE" != "wire" \]; then\s*\n\s*echo "VERIFY-ONLY=1 \(nothing was changed\)"/);
  });

  it('verify reports OFF as the reason no link ever arrives', () => {
    expect(sh).toMatch(/The email door is OFF — that is why no sign-in link ever arrives/);
  });

  it('wiring that left SMTP absent goes RED rather than green', () => {
    expect(sh).toMatch(/case "\$after" in\s*\n\s*host=yes,user=yes,pass=yes\) : ;;/);
    expect(sh).toMatch(/::error::SMTP still not present on supabase-auth/);
  });

  it('a restart that did not come back healthy goes RED too', () => {
    expect(sh).toMatch(/if \[ "\$health" != "200" \]/);
    expect(sh).toMatch(/::error::auth health is/);
  });

  it('CATCHES the silent-no-op case: keys absent entirely are appended, not skipped', () => {
    // awk rewrites lines that exist; if the four keys were never in .env it
    // would copy the file unchanged and report success over a shut door.
    expect(sh).toMatch(/if ! \$SUDO grep -q "\^\$k=" "\$TMP"/);
    expect(sh).toMatch(/echo "APPENDED=\$k"/);
  });
});
