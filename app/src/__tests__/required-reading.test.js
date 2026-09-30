// =============================================================================
// required-reading — PROVEN-TO-CATCH tests for the deterministic resolver
// =============================================================================
// Darrell 2026-08-11: "can we build something that claude just uses when it's
// time same for Ari... so only use an LLMs when necessary?"
//
// The property under test is DR-0080's: this is a PURE FUNCTION of the path.
// Same paths in, same requirement out, no model consulted, no session state.
// If that ever stops being true the gate becomes unpredictable, and an
// unpredictable gate gets routed around.
//
// The manifest-rot test is the one that keeps this honest over time: every
// document named in RULES must actually exist on disk. A requirement pointing
// at a renamed file teaches people the gate is broken, and a gate people
// believe is broken protects nothing.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  RULES, resolveRequiredReading, outstandingReading, requiredReadingMessage,
} from '../lib/required-reading.js';

const REPO = join(process.cwd(), '..');
const ROOT_DOCS = join(REPO, 'docs', '00-foundations', '_root');
const DECISIONS = join(REPO, 'docs', 'decisions');

describe('THE MANIFEST MUST NOT ROT — every named document exists', () => {
  it('points only at real foundation docs and real decision records', () => {
    const drFiles = existsSync(DECISIONS) ? readdirSync(DECISIONS) : [];
    for (const rule of RULES) {
      for (const doc of rule.read) {
        if (doc.startsWith('DR-')) {
          const found = drFiles.some((f) => f.startsWith(`${doc}-`));
          expect(found, `${rule.id} requires ${doc}, which has no file in docs/decisions`).toBe(true);
        } else {
          expect(existsSync(join(ROOT_DOCS, doc)),
            `${rule.id} requires ${doc}, which is not in docs/00-foundations/_root`).toBe(true);
        }
      }
    }
  });

  it('gives every rule a reason, because a requirement without one reads as bureaucracy', () => {
    for (const rule of RULES) {
      expect(rule.why.length, `${rule.id} needs a why`).toBeGreaterThan(40);
    }
  });
});

describe('deterministic resolution (DR-0080: a pure function of the path)', () => {
  it('returns the same answer every time for the same input', () => {
    const a = resolveRequiredReading(['app/src/components/Foo.jsx']);
    const b = resolveRequiredReading(['app/src/components/Foo.jsx']);
    expect(a.docs).toEqual(b.docs);
  });

  it('a new user-facing surface requires the UX and lessons docs', () => {
    const { docs } = resolveRequiredReading(['app/src/components/DataLiberation.jsx']);
    expect(docs).toContain('UX-PATTERNS.md');
    expect(docs).toContain('LESSONS-LEARNED.md');
  });

  it('THE REAL MISS: a sync/persistence lib requires the account + data standards', () => {
    // This is the exact file whose scope was nearly shipped wrong by copying a
    // neighbour instead of reading the standard.
    const { docs } = resolveRequiredReading(['app/src/lib/data-liberation-sync.js']);
    expect(docs).toContain('USER-ACCOUNTS-AND-HISTORIES-STANDARD.md');
    expect(docs).toContain('DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md');
  });

  it('a new table requires the tenancy decision', () => {
    const { docs } = resolveRequiredReading(['infra/supabase/schema-v2.17-data-liberation.sql']);
    expect(docs).toContain('DR-0060');
  });

  it('NAS tooling requires the NAS-Python pattern', () => {
    expect(resolveRequiredReading(['infra/nas-photos-archive/photos_archive.py']).docs)
      .toContain('DR-0083');
  });

  it('content touching the Word requires the citation standard', () => {
    expect(resolveRequiredReading(['app/src/lib/godhead-study.js']).docs)
      .toContain('SCRIPTURE-REFERENCE-STANDARD.md');
  });

  it('handles absolute paths, since hooks receive them', () => {
    const { docs } = resolveRequiredReading(['/home/user/Kingdom-PWA-Node/app/src/components/X.jsx']);
    expect(docs).toContain('UX-PATTERNS.md');
  });

  it('requires NOTHING for unmapped paths — the gate stays narrow', () => {
    expect(resolveRequiredReading(['README.md']).docs).toEqual([]);
    expect(resolveRequiredReading(['app/src/lib/colors.js']).docs).toEqual([]);
  });

  it('never throws on junk input', () => {
    for (const bad of [null, undefined, 'x', [null, 5, {}]]) {
      expect(() => resolveRequiredReading(bad)).not.toThrow();
    }
  });
});

describe('subtraction is what keeps it quiet enough to stay enabled', () => {
  it('asks for nothing once the session has already opened the documents', () => {
    const evidence = 'Read docs/00-foundations/_root/UX-PATTERNS.md and EXCELLENCE-STANDARD.md and LESSONS-LEARNED.md';
    const { missing } = outstandingReading(['app/src/components/Foo.jsx'], evidence);
    expect(missing).toEqual([]);
  });

  it('asks only for the ones still unread', () => {
    const evidence = 'opened UX-PATTERNS.md already';
    const { missing } = outstandingReading(['app/src/components/Foo.jsx'], evidence);
    expect(missing).not.toContain('UX-PATTERNS.md');
    expect(missing).toContain('LESSONS-LEARNED.md');
  });

  it('with no evidence at all, asks for everything the path needs', () => {
    const { missing } = outstandingReading(['app/src/components/Foo.jsx'], '');
    expect(missing.length).toBeGreaterThanOrEqual(3);
  });
});

describe('the message is actionable', () => {
  it('names each document, where to find it, and why it governs', () => {
    const { missing, reasons } = outstandingReading(['infra/supabase/new.sql'], '');
    const msg = requiredReadingMessage(missing, reasons);
    expect(msg).toMatch(/DR-0060/);
    expect(msg).toMatch(/docs\/decisions/);
    expect(msg).toMatch(/RLS/);
  });

  it('points foundation docs at the _root folder', () => {
    const { missing, reasons } = outstandingReading(['app/src/components/Foo.jsx'], '');
    expect(requiredReadingMessage(missing, reasons)).toMatch(/docs\/00-foundations\/_root\/UX-PATTERNS\.md/);
  });
});

// =============================================================================
// DON'T-REPEAT POINTERS (DR-0697) — the failures an area already had, handed
// over at the moment of writing. Darrell 2026-09-30: "Add reviewing the DRs...
// so we don't repeat obvious failures... unless we have another way..."
// =============================================================================
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { DONT_REPEAT, dontRepeatFor, dontRepeatMessage } from '../lib/required-reading.js';

const LESSONS_TEXT = readFileSync(join(ROOT_DOCS, 'LESSONS-LEARNED.md'), 'utf8');

describe("don't-repeat pointers: every citation exists (cite only what exists)", () => {
  it('every P number named is a principle declared in LESSONS-LEARNED, and every DR has a file', () => {
    const drFiles = readdirSync(DECISIONS);
    for (const g of DONT_REPEAT) {
      for (const pt of g.points) {
        for (const [p] of pt.matchAll(/\bP\d+\b/g)) {
          expect(new RegExp(`\\*\\*${p}\\s*[—-]`).test(LESSONS_TEXT), `${g.id} cites ${p}, which LESSONS-LEARNED does not declare`).toBe(true);
        }
        for (const [dr] of pt.matchAll(/\bDR-\d{4}\b/g)) {
          expect(drFiles.some((f) => f.startsWith(`${dr}-`)), `${g.id} cites ${dr}, which has no file`).toBe(true);
        }
      }
    }
  });

  it('keeps each pointer to one short line', () => {
    for (const g of DONT_REPEAT) for (const pt of g.points) expect(pt.length, pt).toBeLessThan(220);
  });
});

describe("don't-repeat pointers: the right area gets the right failures", () => {
  it('a workflow gets list order, concurrency, log masking and single-connector pointers, on a new file AND on an edit', () => {
    for (const edit of [false, true]) {
      const msg = dontRepeatMessage(dontRepeatFor(['.github/workflows/inbox-lesson-tag.yml'], { edit }));
      for (const p of ['P62', 'P63', 'P64', 'P61']) expect(msg, `${p} edit=${edit}`).toContain(p);
    }
  });

  it('a component gets never-blank, copy-with-behavior and scope-placement pointers on a new file only', () => {
    const msg = dontRepeatMessage(dontRepeatFor(['app/src/components/NewPanel.jsx']));
    expect(msg).toMatch(/never goes blank/);
    expect(msg).toMatch(/Copy and behavior are tested together/);
    expect(msg).toContain('P68');
    expect(dontRepeatFor(['app/src/components/NewPanel.jsx'], { edit: true })).toEqual([]);
  });

  it('a lesson catalog gets the four-band, verbatim-Word and derived-count pointers, on edits too', () => {
    const msg = dontRepeatMessage(dontRepeatFor(['app/src/lib/banking-course.js'], { edit: true }));
    expect(msg).toContain('P60');
    expect(msg).toMatch(/all four bands/);
    expect(msg).toMatch(/verbatim/);
    expect(msg).toMatch(/derived/);
  });

  it('orchestration docs and loops get the durable-driver, narrow-brief and measure-first pointers', () => {
    const msg = dontRepeatMessage(dontRepeatFor(['docs/00-foundations/_root/ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md'], { edit: true }));
    for (const p of ['P65', 'P66', 'P67']) expect(msg).toContain(p);
  });

  it('handles absolute paths and stays silent for unmapped ones', () => {
    expect(dontRepeatFor(['/home/user/Kingdom-PWA-Node/.github/workflows/ci.yml'], { edit: true }).map((g) => g.id)).toEqual(['workflows']);
    expect(dontRepeatFor(['README.md'])).toEqual([]);
    expect(dontRepeatFor(['app/src/lib/colors.js'], { edit: true })).toEqual([]);
    expect(dontRepeatMessage([])).toBe('');
  });

  it('PROVEN-TO-CATCH: with the workflow mapping removed, a workflow gets nothing', () => {
    const saved = DONT_REPEAT.splice(DONT_REPEAT.findIndex((g) => g.id === 'workflows'), 1);
    try {
      expect(dontRepeatFor(['.github/workflows/inbox-lesson-tag.yml'], { edit: true })).toEqual([]);
    } finally { DONT_REPEAT.unshift(...saved); }
    expect(dontRepeatFor(['.github/workflows/inbox-lesson-tag.yml'], { edit: true }).length).toBe(1);
  });
});

describe('the hook itself: blocks once with the pointers, then stays quiet, and fails open', () => {
  const HOOK = join(REPO, 'scripts', 'required-reading-pretool-hook.mjs');
  const run = (input, state) => spawnSync(process.execPath, [HOOK], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    env: { ...process.env, REQUIRED_READING_STATE_DIR: state },
    encoding: 'utf8',
  });
  const reason = (out) => JSON.parse(out.stdout).hookSpecificOutput.permissionDecisionReason;

  it('an EDIT of an existing workflow gets the pointers once, then nothing', () => {
    const state = mkdtempSync(join(tmpdir(), 'rr-'));
    const input = { tool_name: 'Edit', session_id: 's1', tool_input: { file_path: join(REPO, '.github', 'workflows', 'inbox-lesson-tag.yml') } };
    const first = run(input, state);
    expect(first.status).toBe(0);
    expect(reason(first)).toContain('P62');
    const second = run(input, state);
    expect(second.status).toBe(0);
    expect(second.stdout).toBe('');
  });

  it('a NEW component gets the surface pointers once even when its reading is done, then nothing', () => {
    const state = mkdtempSync(join(tmpdir(), 'rr-'));
    const transcript = join(state, 't.jsonl');
    writeFileSync(transcript, 'UX-PATTERNS.md EXCELLENCE-STANDARD.md LESSONS-LEARNED.md SCRIPTURE-REFERENCE-STANDARD.md');
    const input = { tool_name: 'Write', session_id: 's2', transcript_path: transcript, tool_input: { file_path: join(REPO, 'app', 'src', 'components', 'ZzNeverCreatedPanel.jsx') } };
    const first = run(input, state);
    expect(reason(first)).toMatch(/never goes blank/);
    expect(reason(first)).not.toMatch(/required-reading \(DR-0080/);
    expect(run(input, state).stdout).toBe('');
  });

  it('an EDIT of an existing component is never blocked', () => {
    const state = mkdtempSync(join(tmpdir(), 'rr-'));
    const out = run({ tool_name: 'Edit', session_id: 's3', tool_input: { file_path: join(REPO, 'app', 'src', 'components', 'SectionTabs.jsx') } }, state);
    expect(out.status).toBe(0);
    expect(out.stdout).toBe('');
  });

  it('fails open on garbage input and on other tools', () => {
    const state = mkdtempSync(join(tmpdir(), 'rr-'));
    for (const bad of ['not json', '', JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' } }), JSON.stringify({ tool_name: 'Edit' })]) {
      const out = run(bad, state);
      expect(out.status).toBe(0);
      expect(out.stdout).toBe('');
    }
  });
});
