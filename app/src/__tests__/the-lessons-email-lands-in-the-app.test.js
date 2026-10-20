// @vitest-environment node
// =============================================================================
// An emailed lesson lands in the APP, not in a Claude session (DR-1132)
// =============================================================================
// Darrell, 2026-10-20:
//
//   "I would like to make sure that the instead of email, instead of Claude
//    looking at the email and having that be the pipeline, why can't we have
//    something inside the app itself be the pipeline for collecting the lessons
//    that come from email?"
//
// WHAT WAS TRUE, measured on main. Every other way a lesson arrives writes an
// `agent_inbox` row, and the app's own machinery carries it from there:
// lesson-inbox.js reads it back into "Your lessons", migration 0252 rings the
// bell if it waits too long, lesson_builder.py picks it up, and
// inbox-lessons-waiting.yml counts it. EMAIL ALONE went a different way --
// lesson-mail-watch.yml peeked the inbox and COMMENTED ON PULL REQUEST #1346 to
// wake a Claude session. So no session meant no lesson, the words stayed in
// Google's store, and the app never saw it, which is why the waiting count can
// read 0 while a lesson sits in the mailbox.
//
// WHY THIS FILE EXISTS BESIDE THE READER'S OWN SELFTEST. lesson_mail.py runs
// `--selftest` (29 checks, no network, no database) and the installer runs it
// first every cycle. But that selftest lives in the same file as the code it
// checks, and nothing in the repo's suite would notice if the file, its
// registration or its brakes disappeared. This is the outside reader: it holds
// the discipline that must be TRUE OF THE FILES, from the JS side, where CI
// already runs.
//
// THE MEASUREMENT THAT MADE THIS URGENT: three lessons already built --
// DR-1114 (sov41), DR-1115 (sov42, the lesson on his screen), DR-1116 (pm13) --
// whose Gmail threads were NEVER labelled after a successful push, so that lane
// re-offered all three as new. `scripts/lesson-already-built.mjs` answered
// "ALREADY BUILT" for two and "LIKELY" for the third. A label in Google's
// system can silently fail to be written and nothing notices; a tag on the row
// cannot, because it is written with the work.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const DIR = join(REPO, 'infra/nas-lesson-mail');
const READER = readFileSync(join(DIR, 'lesson_mail.py'), 'utf8');
const INSTALL = readFileSync(join(DIR, 'install.sh'), 'utf8');
const PLACER = readFileSync(join(DIR, 'place_lesson_mail_key.sh'), 'utf8');
const SERVICES = JSON.parse(readFileSync(join(REPO, 'infra/nas-loops/services.json'), 'utf8'));
const CHURCH = readFileSync(join(REPO, 'infra/nas-church-mail/church_mail.py'), 'utf8');

/** Shell/Python with `#` comment lines removed — prose is never behaviour. */
const codeOnly = (t) => t.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');

const services = Array.isArray(SERVICES) ? SERVICES : SERVICES.services;
const entry = services.find((s) => s.name === 'lesson-mail');

describe('the app is the pipeline: a row, not a session', () => {
  it('the reader INSERTS an agent_inbox row tagged for the lane the app reads', () => {
    const c = codeOnly(READER);
    expect(c).toMatch(/INSERT INTO public\.agent_inbox/);
    expect(c).toMatch(/"source": "email"/);
    expect(c).toMatch(/"tags": \["lesson", tag\]/);
  });

  it('and it pokes no pull request, wakes no session, and needs no Claude', () => {
    // The whole point: the words reach our store without a session running.
    const c = codeOnly(READER);
    expect(c).not.toMatch(/SIGNAL_PR|issues\/\d+\/comments|gh api|1346/);
    expect(c).not.toMatch(/claude/i);
  });

  it('idempotence rides on the ROW, because a Gmail label silently did not', () => {
    // Measured: DR-1114, DR-1115 and DR-1116 are all built and all three
    // threads went unlabelled, so the lane re-offered them as new.
    const c = codeOnly(READER);
    expect(c).toMatch(/def mail_tag/);
    expect(c).toMatch(/"mail:" \+ hashlib\.sha1/);
    expect(c).toMatch(/def filed_tags/);
    // The reader asks the row store what is already filed, not a label API.
    expect(c).toMatch(/startswith\("mail:"\)/);
  });
});

describe('it refuses rather than guesses', () => {
  it('a sender not on the roster is skipped with a reason, never attributed', () => {
    // agent_inbox.created_by is NOT NULL and an email carries an address.
    // Inventing a uuid to make a row fit is the fabrication DR-0545 refused.
    const c = codeOnly(READER);
    expect(c).toMatch(/sender not on the roster/);
    expect(c).not.toMatch(/00000000-0000-0000-0000-000000000000/);
  });

  it('an empty or unreadable roster files nothing at all', () => {
    expect(codeOnly(READER)).toMatch(/def load_roster/);
    expect(codeOnly(READER)).toMatch(/no roster at/);
  });

  it('an audio attachment is set aside naming the voice lane, never read as text', () => {
    // A recording's words come from Whisper on our own machines (DR-0611).
    const c = codeOnly(READER);
    expect(c).toMatch(/belongs to the voice lane/);
    expect(c).toMatch(/AUDIO = re\.compile/);
  });

  it('it never selects a lesson body back out of the store', () => {
    // The standing rule: never a body in a log. filed_tags reads TAGS only.
    const c = codeOnly(READER);
    expect(c).toMatch(/SELECT tags FROM public\.agent_inbox/);
    expect(c).not.toMatch(/SELECT[^;]*\bbody\b[^;]*FROM public\.agent_inbox/);
  });
});

describe('the mailbox is a source, never a workspace', () => {
  it('every fetch is a PEEK, so nothing is marked read, moved or deleted', () => {
    const c = codeOnly(READER);
    expect(c).toMatch(/BODY\.PEEK/);
    expect(c).toMatch(/readonly=True/);
    expect(c).not.toMatch(/\bSTORE\b|\bCOPY\b|\bEXPUNGE\b|\\\\Deleted/);
  });

  it('the credential is read from agent.env, where the house already keeps one', () => {
    // church_mail.py's precedent (DR-1091). I first invented a secrets-file
    // path for this; one place for mailbox credentials beats two.
    expect(codeOnly(READER)).toMatch(/LESSON_MAIL_APP_PASSWORD/);
    expect(codeOnly(CHURCH)).toMatch(/CHURCH_MAIL_APP_PASSWORD/);
  });

  it('and the placer proves it against Gmail before a byte is written', () => {
    const c = codeOnly(PLACER);
    expect(c).toMatch(/imaplib\.IMAP4_SSL/);
    expect(c).toMatch(/nothing written/);
    expect(c).toMatch(/sudo -n/);           // never a password prompt for the NAS
    expect(c).toMatch(/chmod 600/);
  });

  it('the placer never puts the password on a command line or the screen', () => {
    const c = codeOnly(PLACER);
    expect(c).not.toMatch(/echo .*\$\{?password/i);
    expect(c).toMatch(/password: %d characters/);   // a length, never the value
  });
});

describe('the brakes are in the files, not in an intention (DR-0248)', () => {
  it('a budget in messages AND in seconds, inside the installer ceiling', () => {
    const c = codeOnly(READER);
    expect(c).toMatch(/--max-messages/);
    expect(c).toMatch(/--max-seconds/);
    expect(codeOnly(INSTALL)).toMatch(/--max-messages "\$\{LESSON_MAIL_MAX:-25\}"/);
    expect(codeOnly(INSTALL)).toMatch(/--max-seconds "\$\{LESSON_MAIL_SECONDS:-360\}"/);
  });

  it('a single-flight PID lock, so a second pass skips rather than stacks', () => {
    const c = codeOnly(READER);
    expect(c).toMatch(/def take_lock/);
    expect(c).toMatch(/O_CREAT \| os\.O_EXCL/);
    expect(c).toMatch(/already running, skipping \(single-flight\)/);
    // AND THE BRAKE IS CALLED, not merely defined. A HOLE IN THIS VERY CASE,
    // found by breaking it: replacing `if not take_lock():` with `if False:`
    // left the function and its message intact, so this passed with the brake
    // GONE. Checking the text and not the call is the same defect as DR-0748's
    // exact-line import assertion, and it is why proven-to-catch exists.
    expect(c, 'take_lock() is actually called').toMatch(/if not take_lock\(\):/);
  });

  it('progress saved per message, so a budgeted pass resumes where it stopped', () => {
    const c = codeOnly(READER);
    expect(c).toMatch(/def save_state/);
    expect(c).toMatch(/state\["last_uid"\] = uid/);
    expect(c, 'save_state() is actually called').toMatch(/\n\s*save_state\(state\)/);
  });

  it('PROVEN-TO-CATCH: every brake is CALLED, not just present', () => {
    // One case over all of them, so a future brake cannot be defined-but-dead.
    // The reader's own --selftest walks main()'s call graph for undefined names;
    // this is the mirror of that from outside: the names that must BE there.
    const c = codeOnly(READER);
    for (const call of ['take_lock()', 'save_state(state)', 'load_roster()', 'run_pass(']) {
      expect(c, `${call} appears as a call, not only a definition`)
        .toMatch(new RegExp(`[^f]\\b${call.replace(/[()]/g, (m) => `\\${m}`)}`));
    }
  });

  it('a message that fails MAX_FAILS times is set aside WITH ITS REASON', () => {
    const c = codeOnly(READER);
    expect(c).toMatch(/MAX_FAILS = 3/);
    expect(c).toMatch(/state\["set_aside"\]\[key\] = str\(e\)\[:300\]/);
  });

  it('and a set-aside reds the cycle rather than failing quietly', () => {
    expect(codeOnly(READER)).toMatch(/return 3 if tally\["failed"\] or tally\["set_aside"\]/);
  });
});

describe('it is armed, and it arms itself safely', () => {
  it('registered with services-sync, enabled, riding the already-armed clock', () => {
    // enabled: true is safe BECAUSE the reader self-gates to a named no-op —
    // proven by running it with no credential and with no roster: both say
    // which half is missing and exit 0. Arming it activates nothing; it means
    // the moment the key is placed it works, with no further step (DR-0247).
    expect(entry, 'lesson-mail is in services.json').toBeTruthy();
    expect(entry.install).toBe('infra/nas-lesson-mail/install.sh');
    expect(entry.enabled).toBe(true);
    expect(existsSync(join(REPO, entry.install))).toBe(true);
  });

  it('no credential and no roster are each a NAMED no-op, not a failure', () => {
    const c = codeOnly(READER);
    expect(c).toMatch(/dormant: %s not set in %s \(honest no-op\)/);
    expect(c).toMatch(/dormant: no roster at/);
    // Both paths return 0 — a dormant reader must not red the cycle.
    expect(c).toMatch(/honest no-op[\s\S]{0,400}?return 0/);
  });

  it('the installer runs the selftest FIRST, before it touches the mailbox', () => {
    // A reader broken by an edit says so before it reads a person's mail.
    const c = codeOnly(INSTALL);
    const selftest = c.indexOf('--selftest');
    const read = c.indexOf('--max-messages');
    expect(selftest).toBeGreaterThan(0);
    expect(read).toBeGreaterThan(selftest);
    expect(c).toMatch(/not reading the mailbox/);
  });

  it('it rides the services-sync clock with no new DSM entry', () => {
    // church-mail's pattern: a stamp gate, not a systemd timer. I started
    // writing a unit file; the house deliberately avoids them here.
    const c = codeOnly(INSTALL);
    expect(c).toMatch(/LESSON_MAIL_GAP_SECONDS:-900/);
    expect(existsSync(join(DIR, 'poetech-lesson-mail.service'))).toBe(false);
  });
});

describe('the witness really looks at this loop (DR-1119 refused it otherwise)', () => {
  // CAUGHT BY A GATE, NOT BY ME. The full suite went red on one case of 27,894:
  // a-service-comes-home.test.js, "lesson-mail is enabled but on neither list; a
  // new service walks the Way". Enabling a loop whose witness had never heard of
  // it is the hollow version of walking the Way (DR-0621: a new workflow joins
  // the flow AT BIRTH, not in a later audit), and the Way's own gate said so.
  const LOOPS = readFileSync(join(REPO, '.github/workflows/loops-health.yml'), 'utf8');

  it('loops-health asks after lesson-mail by name, in every place it asks', () => {
    // Four separate places, because the witness is four readings: the loop list
    // it judges, the ledger it reads, the installer it checks is on the box, and
    // the cron-log prefix it quotes. A name in one and not the others reports a
    // loop as fine on evidence it never gathered.
    expect(LOOPS).toMatch(/loops = \[[^\]]*"lesson-mail"/);
    expect(LOOPS).toMatch(/"lesson-mail": \(jl\(os\.environ\.get\("LM", ""\)\)/);
    expect(LOOPS).toMatch(/"lesson-mail": "infra\/nas-lesson-mail\/install\.sh"/);
    expect(LOOPS).toMatch(/prefixes = \{[^}]*"lesson-mail": "lesson-mail"/);
  });

  it('and it reads the state file the reader actually writes, in its own home', () => {
    // MY OWN ERROR, PINNED. I first copied church-mail's path and had the
    // witness read $REPO/infra/nas-lesson-mail/out/.lesson-mail.state.json — a
    // file nothing ever writes. The reader keeps its state under
    // LESSON_MAIL_HOME (/volume1/PoeTech/lesson-mail), like lesson-voice and
    // db-backup; the installer says so in one line. A witness pointed at the
    // wrong file does not fail — it reports "no ledger" forever, which reads
    // like a loop that has never run.
    expect(INSTALL).toMatch(/OUT="\$\{LESSON_MAIL_HOME:-\/volume1\/PoeTech\/lesson-mail\}"/);
    expect(READER).toMatch(/LESSON_MAIL_HOME", "\/volume1\/PoeTech\/lesson-mail"/);
    expect(LOOPS).toContain('/volume1/PoeTech/lesson-mail/.lesson-mail.state.json');
    expect(LOOPS).not.toContain('nas-lesson-mail/out/.lesson-mail');
  });

  it('its diagnosis says whether the one value only Darrell holds is there — by name, never printed', () => {
    const at = LOOPS.indexOf('lesson-mail) ls -la');
    expect(at).toBeGreaterThan(0);
    const branch = LOOPS.slice(at, at + 1400);
    expect(branch).toMatch(/mailbox credential: present/);
    expect(branch).toMatch(/mailbox credential: ABSENT/);
    expect(branch).toMatch(/lesson-mail-roster\.json/);
    // grep -q, never a read of the value: the name of the variable is the whole
    // answer, and the password never reaches a log.
    expect(branch).toMatch(/grep -q '\^LESSON_MAIL_APP_PASSWORD='/);
    expect(branch).not.toMatch(/cat [^\n|]*agent\.env/);
  });

  it('the Way lists it as a loop born BY the Way, not as one awaiting an audit', () => {
    const way = readFileSync(join(HERE, 'a-service-comes-home.test.js'), 'utf8');
    const loops = way.slice(way.indexOf('LOOPS_ON_THE_WAY'), way.indexOf('BORN_BEFORE_THE_WAY'));
    expect(loops).toMatch(/'lesson-mail': \{ witness: 'loops-health\.yml' \}/);
  });
});

describe('the Gmail watcher STAYS, and the graph says why', () => {
  it('lesson-mail-watch.yml is still present and still registered', () => {
    // DR-0610 runs both lesson doors in parallel until the Governor is
    // confident the in-app reader is armed — and this reader cannot run at all
    // until the credential exists. Retiring the working path for an inert one
    // would be backwards; retiring it would ALSO orphan gh:signal-pr, which
    // lesson-capture reads.
    expect(existsSync(join(REPO, '.github/workflows/lesson-mail-watch.yml'))).toBe(true);
    const reg = readFileSync(join(REPO, 'scripts/system-flow-registry.mjs'), 'utf8');
    expect(reg).toMatch(/wf\('lesson-mail-watch\.yml'/);
    expect(reg).toMatch(/res: 'gh:signal-pr'/);
  });

  it('and the reader seeds the NAS lesson builder, which the guard made me name', () => {
    // I first wrote seeds: ['lesson-capture'] — what the WATCHER seeds — and
    // interconnect-guard refused it: "lesson-capture reads nothing lesson-mail
    // writes." It reads the PR poke; this writes a ROW.
    const reg = readFileSync(join(REPO, 'scripts/system-flow-registry.mjs'), 'utf8');
    const at = reg.indexOf("rider('service:lesson-mail'");
    expect(at).toBeGreaterThan(0);
    const node = reg.slice(at, at + 1600);
    expect(node).toMatch(/seeds: \['lesson-builder'\]/);
    expect(node).toMatch(/INSERT INTO public\.agent_inbox/);
  });
});
