// @vitest-environment node
//
// THE READER MAY SEE WHAT PEOPLE SAID. IT MAY NOT SEE THEIR SCREENS.
//
// scripts/sovereign-read-over-tailnet.sh exists because the AI that DR-0067
// decision 2 places FIRST in the feedback loop had been reading the hosted
// database while the app wrote to the sovereign one — measured 2026-09-12, the
// newest hosted feedback row was 2026-08-19, the repoint day, so 24 days of
// what the family and the congregation said was invisible.
//
// Giving an agent that reach is a real widening, and these are the walls on it.
// They are asserted against the SHIPPED FILE rather than trusted to a comment,
// and the header comment deliberately discusses screenshots and confidentiality
// — so every scan here strips comments first. (This suite has caught its own
// explanation four times; the habit is now the default.)
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const SCRIPT = join(ROOT, 'scripts/sovereign-read-over-tailnet.sh');
const raw = readFileSync(SCRIPT, 'utf8');
// Shell comments only — a '#' inside a quoted string is not one, but this file
// has none, and over-stripping can only make the walls stricter, never laxer.
const code = raw.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');

/** The columns the feedback query actually asks for. */
function selectedFeedbackColumns(src) {
  const m = /SELECT submitted_at,([\s\S]*?)FROM public\.feedback/.exec(src);
  if (!m) return null;
  return `submitted_at,${m[1]}`
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

describe('what the reader is allowed to ask for', () => {
  it('selects an explicit allowlist of columns, and that list is the whole list', () => {
    expect(selectedFeedbackColumns(code)).toEqual([
      'submitted_at', 'display_name', 'app_version', 'which_tab',
      'feedback_text', 'sentiment', 'triage_status',
      'has_screenshot', 'screenshot_count',
    ]);
  });

  it('NEVER selects the screenshot bytes themselves', () => {
    // has_screenshot / screenshot_count are metadata — "there is one", not
    // what is in it. The image columns are never named at all.
    const cols = selectedFeedbackColumns(code);
    expect(cols).not.toContain('screenshot');
    expect(cols).not.toContain('screenshots');
  });

  it('withholds confidential rows in the QUERY, not in the formatting', () => {
    // A filter applied after the rows have travelled is not a wall.
    expect(code).toMatch(/WHERE coalesce\(is_confidential, false\) = false/);
  });

  it('still COUNTS the confidential rows, so their existence is never hidden', () => {
    expect(code).toMatch(/confidential_withheld='\|\|count\(\*\) FILTER \(WHERE coalesce\(is_confidential,false\)\)/);
  });

  it('reads no user data at all in definitions mode', () => {
    const defs = code.slice(code.indexOf('---DEFINITIONS---'));
    for (const t of ['feedback', 'church_member_records', 'household_records', 'auth.users']) {
      expect(defs, t).not.toContain(t);
    }
  });
});

describe('proven-to-catch: the masking actually masks (run, not read)', () => {
  // The sed pipeline from the script, executed against planted text. A regex
  // that is merely present proves nothing; this one has to work.
  const mask = (s) => execFileSync('bash', ['-c',
    `printf '%s' "$1" | sed -E 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}/<email masked>/g' | sed -E 's/(\\+?1[ .-]?)?\\(?[0-9]{3}\\)?[ .-]?[0-9]{3}[ .-]?[0-9]{4}/<phone masked>/g'`,
    'bash', s]).toString();

  it('CATCHES an email address in the text', () => {
    const out = mask('call me at brother.clifton@example.com about the bus');
    expect(out).not.toContain('@example.com');
    expect(out).toContain('<email masked>');
    expect(out).toContain('about the bus');   // the MEANING survives
  });

  it('CATCHES a phone number in every shape people write one', () => {
    for (const p of ['(563) 650-2416', '563-650-2416', '5636502416', '+1 563 650 2416']) {
      expect(mask(`reach me ${p} please`), p).toContain('<phone masked>');
    }
  });

  it('leaves ordinary feedback untouched — masking must not eat the report', () => {
    const words = 'The Owed tab hit an error when I opened it on my phone';
    expect(mask(words)).toBe(words);
  });

  it('the script really uses these two expressions', () => {
    expect(code).toContain('<email masked>');
    expect(code).toContain('<phone masked>');
  });
});

describe('the mail probe — presence, never a password', () => {
  const mail = code.slice(code.indexOf('MAIL CONFIG'));

  it('asks the questions that decide whether a link can ever arrive', () => {
    for (const k of ['SMTP_HOST', 'SMTP_PASS', 'GOTRUE_MAILER_AUTOCONFIRM', 'SITE_URL', 'ADDITIONAL_REDIRECT_URLS']) {
      expect(mail, k).toContain(k);
    }
  });

  it('NEVER prints a password value — presence is the whole question', () => {
    // A withheld secret is the point; "set (value withheld)" answers
    // "can it send?" without handing anyone the credential.
    expect(mail).toMatch(/SMTP_PASS\|GOTRUE_SMTP_PASS\).*value withheld/s);
  });

  it('DOES print the URL settings, because their content is the bug', () => {
    // A redirect list that omits the church's own door is exactly the kind of
    // defect "set" would hide. The PROPERTY: there is a branch that prints the
    // actual value, and the URL keys are the ones routed into it — asserted as
    // two facts rather than as one brittle shape.
    expect(mail).toContain('echo "$k = $val"');
    const valueBranch = mail.slice(mail.indexOf('SITE_URL|API_EXTERNAL_URL'));
    expect(valueBranch.slice(0, 400)).toContain('$val');
    // ... and the password keys are NOT in that branch.
    const passBranch = mail.slice(mail.indexOf('SMTP_PASS|GOTRUE_SMTP_PASS'), mail.indexOf('SITE_URL|API_EXTERNAL_URL'));
    expect(passBranch).not.toContain('echo "$k = $val"');
  });

  it('reads no user table in mail mode', () => {
    for (const t of ['feedback', 'church_member_records', 'auth.users']) {
      expect(mail, t).not.toContain(t);
    }
  });
});

describe('the shape of the lane', () => {
  const wf = readFileSync(join(ROOT, '.github/workflows/sovereign-read.yml'), 'utf8');
  const wfCode = wf.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n');

  it('is dispatch-only — no schedule, so it is not the timer-driven class', () => {
    expect(wfCode).toContain('workflow_dispatch:');
    expect(wfCode).not.toMatch(/\bschedule:/);
    expect(wfCode).not.toMatch(/\bcron\b/);
  });

  it('asks for no write permission', () => {
    expect(wfCode).toMatch(/permissions:\s*\n\s*contents: read/);
  });

  it('refuses to report an unread database as known', () => {
    expect(code).toMatch(/An unasked database is never reported as known/);
    expect(code).toMatch(/exit 2/);
  });
});
