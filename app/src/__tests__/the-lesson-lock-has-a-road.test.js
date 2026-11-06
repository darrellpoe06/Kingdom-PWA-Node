// The lesson lock has a road a runner can walk (DR-1353).
// =============================================================================
// The Gmail-lesson-intake Way says a thread is labelled Lesson-Captured once its
// lesson ships. It had NEVER been set on a built thread, because the only road
// was a connector write that stops for a human approval every time. These cases
// pin the parts of the new road that can be checked without a mailbox -- and the
// id conversion is the one most able to fail silently.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ALLOWED_LABELS,
  THREAD_ID,
  threadIdToThrid,
  assertLabel,
  imapPlan,
  parseThreadIds,
} from '../../../scripts/gmail-thread-label.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const WORKFLOW = join(ROOT, '.github', 'workflows', 'lesson-mail-label.yml');

describe('the thread id is converted, and that is the part that fails silently', () => {
  it('hex to decimal, on the three real threads this was built for', () => {
    // Measured from the live mailbox, so these are not invented fixtures.
    expect(threadIdToThrid('1a163d58a4d068b6')).toBe('1879757345405298870');
    expect(threadIdToThrid('1a16401bf7c5898d')).toBe('1879760383338973581');
    expect(threadIdToThrid('1a164aff48fa13de')).toBe('1879772354775225310');
  });

  it('uses BigInt, because these numbers are past MAX_SAFE_INTEGER', () => {
    // THE WHOLE REASON THIS IS PINNED. parseInt('1a163d58a4d068b6', 16) rounds,
    // and a rounded X-GM-THRID matches no message and reports NO error -- which
    // reads exactly like "already labelled". Nothing would ever have been set.
    const n = Number.parseInt('1a163d58a4d068b6', 16);
    expect(n).toBeGreaterThan(Number.MAX_SAFE_INTEGER);
    expect(String(n)).not.toBe('1879757345405298870');
    expect(threadIdToThrid('1a163d58a4d068b6')).toBe('1879757345405298870');
  });

  it('accepts the shape the API gives and refuses anything else', () => {
    expect(THREAD_ID.test('1a163d58a4d068b6')).toBe(true);
    for (const bad of ['', 'not-hex', '1A163D58A4D068B6!', '0x1a163d58', '12', 'g'.repeat(16)]) {
      expect(() => threadIdToThrid(bad), bad).toThrow(/not a Gmail thread id/);
    }
  });

  it('is case- and whitespace-tolerant, since ids get pasted', () => {
    expect(threadIdToThrid('  1A163D58A4D068B6 ')).toBe('1879757345405298870');
  });
});

describe('it can only ever write the two locks', () => {
  it('allows exactly Lesson-Captured and Lesson-Published', () => {
    expect(ALLOWED_LABELS).toEqual(['Lesson-Captured', 'Lesson-Published']);
    for (const ok of ALLOWED_LABELS) expect(assertLabel(ok)).toBe(ok);
  });

  it('refuses any other label, including ones that look harmless', () => {
    for (const bad of ['INBOX', 'TRASH', 'SPAM', 'Lesson-Captured ', 'lesson-captured', 'Label_22', '']) {
      expect(() => assertLabel(bad), bad).toThrow(/refusing label/);
    }
  });
});

describe('the IMAP plan', () => {
  it('selects All Mail, not Inbox', () => {
    // A forwarded thread is often already archived. Selecting Inbox would find
    // nothing, label nothing, and exit without complaint.
    const plan = imapPlan(['1a163d58a4d068b6'], 'Lesson-Captured');
    expect(plan.select).toBe('"[Gmail]/All Mail"');
    expect(plan.readonly).toBe(false);
  });

  it('searches by X-GM-THRID in decimal and adds the label with +X-GM-LABELS', () => {
    const [step] = imapPlan(['1a163d58a4d068b6'], 'Lesson-Captured').steps;
    expect(step.search).toEqual(['UID', 'SEARCH', 'X-GM-THRID', '1879757345405298870']);
    expect(step.store(['7', '8'])).toEqual(['UID', 'STORE', '7,8', '+X-GM-LABELS', '(Lesson-Captured)']);
  });

  it('adds rather than replaces, so an existing label survives', () => {
    const [step] = imapPlan(['1a163d58a4d068b6'], 'Lesson-Published').steps;
    expect(step.store(['1'])[3], 'a bare X-GM-LABELS would REPLACE every label on the thread').toBe('+X-GM-LABELS');
  });

  it('de-duplicates and holds a per-run budget of 10', () => {
    const plan = imapPlan(['1a163d58a4d068b6', '1A163D58A4D068B6'], 'Lesson-Captured');
    expect(plan.steps).toHaveLength(1);
    const eleven = Array.from({ length: 11 }, (_, i) => (0x1a163d58a4d068b6n + BigInt(i)).toString(16));
    expect(() => imapPlan(eleven, 'Lesson-Captured')).toThrow(/over the per-run budget of 10/);
  });

  it('refuses an empty list rather than reporting a vacuous success', () => {
    expect(() => imapPlan([], 'Lesson-Captured')).toThrow(/no thread ids/);
    expect(() => imapPlan(['', '  '], 'Lesson-Captured')).toThrow(/no thread ids/);
  });

  it('parses the pasted input the workflow takes', () => {
    expect(parseThreadIds('1a163d58a4d068b6, 1a16401bf7c5898d  1a164aff48fa13de')).toEqual([
      '1a163d58a4d068b6',
      '1a16401bf7c5898d',
      '1a164aff48fa13de',
    ]);
    expect(parseThreadIds('')).toEqual([]);
    expect(parseThreadIds(undefined)).toEqual([]);
  });
});

describe('the workflow is the narrow kind it claims to be', () => {
  const yml = () => readFileSync(WORKFLOW, 'utf8');

  it('is dispatch-only, so it is not the timer-driven class the three brakes govern', () => {
    const src = yml();
    expect(src).toContain('workflow_dispatch:');
    expect(src, 'a schedule would make this the class DR-0247 governs').not.toMatch(/^\s*schedule:/m);
  });

  it('carries a concurrency group and a timeout', () => {
    expect(yml()).toMatch(/group:\s*lesson-mail-label/);
    expect(yml()).toMatch(/timeout-minutes:\s*\d+/);
  });

  it('mutates nothing but the label', () => {
    // THE CODE, NOT THE COMMENTS -- and this check taught me that twice over.
    // First draft used new RegExp("uid('COPY") and threw "Unterminated group":
    // a check that cannot run is not a check. Second draft then matched the word
    // "trash" inside this workflow's OWN comment saying it never trashes
    // anything -- the same false positive I removed from the DR-0719 teacher
    // registry hours earlier, where a comment forbidding a credit was read as
    // evidence of it. A scanner that reads prose as code will always find the
    // thing the prose promises not to do.
    const code = yml()
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .join('\n')
      .toLowerCase();
    for (const verb of ['\\deleted', 'expunge', "uid('copy", "uid('move", 'trash', 'store_flags']) {
      expect(code, `the labeller must not carry ${verb}`).not.toContain(verb);
    }
    // And the one mutation it DOES carry must be the additive label form. An
    // occurrence COUNT was tried here and removed: I pinned 4 without measuring
    // (it is 3), and a number that moves whenever a comment is edited is a check
    // that cries wolf. What matters is the form, asserted here and in the
    // read-back case below.
    expect(code).toContain('+x-gm-labels');
  });

  it('reads the label back instead of trusting STORE, and never prints a subject or body', () => {
    const src = yml();
    expect(src).toContain("M.uid('FETCH', uids[0], '(X-GM-LABELS)')");
    expect(src, 'never a body (the standing rule)').not.toMatch(/BODY\[\]|RFC822|HEADER\.FIELDS \(SUBJECT/);
  });

  it('exits honestly when the secret is absent rather than claiming success', () => {
    const src = yml();
    expect(src).toMatch(/dormant/);
    expect(src).toMatch(/nothing claimed/);
  });

  it('fails the run when a thread was not found, so a silent miss cannot read as done', () => {
    expect(yml()).toMatch(/if failed or missing:\s*\n\s*sys\.exit\(1\)/);
  });
});
