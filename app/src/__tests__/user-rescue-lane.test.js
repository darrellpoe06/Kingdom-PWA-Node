// @vitest-environment node
// =============================================================================
// A locked-out family member is rescued by the lane, not by Darrell's hand
// =============================================================================
// Darrell 2026-09-16: "Always saying you need mee holding up progress!!!! Cli
// Ssh... what do you need from me?!!!!" and "She should never be logged [out]
// or not able to get in!!!!!"
//
// clear_user_pin.sh and reset_password.sh were written on 2026-09-07 for
// exactly this lockout and then left runnable only over ConnectBot. Nothing in
// them needs HIS hand — they need root on the NAS, which NAS_SSH_KEY has. These
// pins keep the wiring in place, and keep the two rules that make it safe to
// run from CI at all: the generated password never reaches the log, and the
// address is masked in everything the run prints.
//
// The post-state assertions are the anti-theater half (DR-0076 §3): a run that
// left the PIN wall standing, or the account unconfirmed, must go RED rather
// than report a green rescue over a door that is still shut.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), '..');
const WF = join(ROOT, '.github/workflows/nas-user-rescue.yml');
const SH = join(ROOT, 'scripts/user-rescue-over-tailnet.sh');
const read = (p) => readFileSync(p, 'utf8');

describe('nas-user-rescue.yml — the rescue is a dispatchable lane', () => {
  const wf = read(WF);

  it('exists and is dispatch-only (it changes a credential; never on a timer)', () => {
    expect(existsSync(WF)).toBe(true);
    expect(wf).toMatch(/^on:\s*\n\s+workflow_dispatch:/m);
    expect(wf).not.toMatch(/^\s+schedule:/m);
    expect(wf).not.toMatch(/^\s+push:/m);
  });

  it('takes the account plus both walls as separate, defaulted decisions', () => {
    expect(wf).toMatch(/email:\s*\n\s+description:/);
    expect(wf).toMatch(/required:\s*true/);
    expect(wf).toMatch(/clear_pin:[\s\S]{0,400}?default:\s*true/);
    expect(wf).toMatch(/new_password:[\s\S]{0,500}?default:\s*true/);
  });

  it('rides the proven remote-hands channel (tailnet joined, verified, NAS_SSH_KEY)', () => {
    expect(wf).toMatch(/uses:\s*tailscale\/github-action@v3/);
    expect(wf).toMatch(/tailscale status --peers=false/);
    expect(wf).toMatch(/NAS_SSH_KEY:\s*\$\{\{\s*secrets\.NAS_SSH_KEY\s*\}\}/);
    expect(wf).toMatch(/run:\s*bash scripts\/user-rescue-over-tailnet\.sh/);
  });

  it('is single-instance, so two rescues cannot race on one account', () => {
    expect(wf).toMatch(/concurrency:\s*\n\s+group:\s*nas-user-rescue\s*\n\s+cancel-in-progress:\s*false/);
  });
});

describe('the password never reaches the log, and the address is masked', () => {
  const sh = read(SH);

  it('generates the password ON THE NAS, never on the runner', () => {
    expect(sh).toMatch(/\/dev\/urandom/);
    // The generation line lives inside the quoted remote heredoc.
    const remote = sh.slice(sh.indexOf("<<'REMOTE'"), sh.indexOf('\nREMOTE\n'));
    expect(remote).toMatch(/NEWPW=\$\(LC_ALL=C tr -dc/);
  });

  it('prints the FILE PATH, never the secret itself', () => {
    expect(sh).toMatch(/RESCUE-FILE=/);
    expect(sh).toMatch(/The password itself is NOT in this log, by design/);
    // Nothing may echo the variable holding the password.
    expect(sh).not.toMatch(/echo[^\n]*\$NEWPW/);
    expect(sh).not.toMatch(/say[^\n]*\$NEWPW/);
    // Even the script's own output is scrubbed before it is printed.
    expect(sh).toMatch(/s\/\$NEWPW\/<the password>\/g/);
  });

  it('writes the password root-only, and clears it from memory after', () => {
    expect(sh).toMatch(/chmod 600 "\$OUTFILE"/);
    expect(sh).toMatch(/chmod 700 "\$OUTDIR"/);
    expect(sh).toMatch(/NEWPW=""/);
  });

  it('masks the address in everything it prints (the counts-only rule)', () => {
    expect(sh).toMatch(/^mask\(\)/m);
    expect(sh).toMatch(/MASKED="\$\(mask "\$RESCUE_EMAIL"\)"/);
    expect(sh).toMatch(/say "- account: \$MASKED"/);
    // Belt and braces on the captured remote output.
    expect(sh).toMatch(/OUT=\$\{OUT\/\/\$RESCUE_EMAIL\/<account>\}/);
    expect(sh).toMatch(/errtxt=\$\{errtxt\/\/\$RESCUE_EMAIL\/<account>\}/);
  });

  it('never prints the raw address via the remote scripts either', () => {
    expect(sh).toMatch(/sed "s\/\$EMAIL\/<account>\/g/);
  });
});

describe('a rescue that did not actually open the door goes RED', () => {
  const sh = read(SH);

  it('characterizes BEFORE and proves AFTER, rather than claiming (DR-0076)', () => {
    expect(sh).toMatch(/STATE-BEFORE=/);
    expect(sh).toMatch(/PIN-BEFORE=/);
    expect(sh).toMatch(/STATE-AFTER=/);
    expect(sh).toMatch(/PIN-AFTER=/);
  });

  it('fails when the account did not end up confirmed with a password set', () => {
    expect(sh).toMatch(/case "\$after" in confirmed=1,pw_set=1,\*\) ok=1/);
    expect(sh).toMatch(/the person still cannot sign in/);
  });

  // PROVEN-TO-CATCH, on this lane's own first real run (35100570812). The
  // original check asked only "is a password SET?" and went GREEN on a run
  // whose reset had failed with an stty error and written nothing, because the
  // account already carried an older password. A reset must now prove the
  // stored hash CHANGED, or the run is red.
  it('CATCHES a reset that changed nothing, by fingerprinting the stored hash', () => {
    expect(sh).toMatch(/pwfp=/);
    expect(sh).toMatch(/fp_before=/);
    expect(sh).toMatch(/fp_after=/);
    expect(sh).toMatch(/\[ "\$fp_before" = "\$fp_after" \]/);
    expect(sh).toMatch(/::error::password unchanged - the new password was never written/);
  });

  it('CATCHES a password that was set but never recorded for a human to read', () => {
    expect(sh).toMatch(/::error::password set but not recorded - re-run before telling anyone it works/);
  });

  it('does not depend on a prompt that needs a terminal (the stty defect)', () => {
    // reset_password.sh reads under `stty -echo`, which has no terminal on a
    // runner; piping to it silently set nothing. The write is done directly
    // with the same pgcrypto bcrypt SQL instead.
    expect(sh).toMatch(/crypt\(:'pw', gen_salt\('bf'\)\)/);
    expect(sh).not.toMatch(/\|\s*\$SUDO sh "\$REPO\/infra\/nas-supabase\/reset_password\.sh"/);
  });

  it('fails when a PIN clear was asked for and the wall is still up', () => {
    expect(sh).toMatch(/case "\$pina" in\s*\n\s*pin_set=0\*\|no_pin_row\)/);
    expect(sh).toMatch(/PIN post-state is/);
  });

  it('refuses to invent an account, and says so instead of creating one', () => {
    expect(sh).toMatch(/RESCUE-ABORT=no such account \(this lane never creates one\)/);
  });

  it('confirms the address deliberately, because the email door cannot', () => {
    // SMTP is unwired by design (DR-0307 §3), so an unconfirmed address would
    // otherwise be a reset that "worked" and still refused every sign-in.
    expect(sh).toMatch(/--confirm-email/);
    expect(sh).toMatch(/SMTP wired in supabase-auth: no/);
  });
});

describe('the order inquiries are answered from the database, not the banner', () => {
  const sh = read(SH);

  it('reports the real Moore lead counts, so "did it go through" has an answer', () => {
    expect(sh).toMatch(/ORDERS=/);
    expect(sh).toMatch(/FROM crm_leads/);
    expect(sh).toMatch(/last24h=/);
    expect(sh).toMatch(/say "- Moore order inquiries in the database: /);
  });

  it('counts only — no customer name or address is ever selected', () => {
    const q = sh.slice(sh.indexOf('----- moore order inquiries'), sh.indexOf('# AFTER: prove it'));
    expect(q).not.toMatch(/\bname\b/);
    expect(q).not.toMatch(/contact_value/);
  });
});
