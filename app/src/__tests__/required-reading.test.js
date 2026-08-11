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
