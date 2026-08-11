// =============================================================================
// cited-but-unread — PROVEN-TO-CATCH tests, replaying the REAL incident
// =============================================================================
// Darrell 2026-08-11: "How can we make sure what is required reading for
// context actually gets read by claude?"
//
// The control case is not invented. It is the actual failure from this session:
// the agent wrote DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md into a file header
// having only read CLAUDE.md's summary of it. The first test below is that
// exact transcript shape, and it must fail the guard.
//
// The false-positive tests matter just as much. A guard that fires on ordinary
// prose gets switched off within a day, and a switched-off guard protects
// nothing — so citing a doc you DID read, in any of the ways this repo reads
// (Read tool, cat, sed, grep), must pass silently.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  checkCitedButUnread, readEvidenceFromTranscript, citedButUnreadReason,
} from '../lib/cited-but-unread.js';

describe('THE REAL INCIDENT — citing a foundation doc that was never opened', () => {
  it('catches DATA-AS-EMPOWERMENT cited with no read of it', () => {
    const out = checkCitedButUnread({
      // Note: NO .md — this is the literal form the header used, and the form
      // that defeated the first version of this guard.
      claimText: '// WHY THIS IS A PRODUCT (DATA-AS-EMPOWERMENT-NOT-EXTRACTION): the vendors...',
      readPaths: ['/repo/CLAUDE.md', '/repo/docs/decisions/DR-0238-gmail-backup.md'],
      knownDocs: ['DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md', 'THE-WAY.md', 'UX-PATTERNS.md'],
    });
    expect(out.ok).toBe(false);
    expect(out.unread).toContain('DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md');
  });

  it('passes the SAME citation once the document was actually read', () => {
    const out = checkCitedButUnread({
      claimText: '// WHY THIS IS A PRODUCT (DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md): the vendors...',
      readPaths: ['/repo/docs/00-foundations/_root/DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md'],
      knownDocs: ['DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md'],
    });
    expect(out.ok).toBe(true);
  });

  it('accepts a shell read, because that is how big docs get sampled here', () => {
    const out = checkCitedButUnread({
      claimText: 'Per UX-PATTERNS.md pattern 3, progressive disclosure...',
      readPaths: [],
      shellText: ['sed -n \'1,60p\' docs/00-foundations/_root/UX-PATTERNS.md'],
    });
    expect(out.ok).toBe(true);
  });
});

describe('the known-docs list is what keeps it precise', () => {
  it("does NOT fire on CLAUDE.md's terminology bindings, which are not documents", () => {
    const out = checkCitedButUnread({
      claimText: 'Follow NOTICE-TEST-CAPTURE-REDIRECT and keep it WORD-FIRST.',
      knownDocs: ['THE-WAY.md', 'MIND-OF-CHRIST.md'],
    });
    expect(out.ok).toBe(true);
  });

  it('catches a real doc cited bare, alongside bindings it ignores', () => {
    const out = checkCitedButUnread({
      claimText: 'Per MIND-OF-CHRIST we run the Test, NOTICE-TEST-CAPTURE-REDIRECT.',
      readPaths: [],
      knownDocs: ['MIND-OF-CHRIST.md', 'THE-WAY.md'],
    });
    expect(out.unread).toEqual(['MIND-OF-CHRIST.md']);
  });
});

describe('decision records are claims too', () => {
  it('catches a DR cited without opening it', () => {
    const out = checkCitedButUnread({
      claimText: 'This follows DR-0060 tenancy scoping.',
      readPaths: ['/repo/CLAUDE.md'],
    });
    expect(out.ok).toBe(false);
    expect(out.unread).toContain('DR-0060');
  });

  it('passes when the DR file was opened', () => {
    const out = checkCitedButUnread({
      claimText: 'This follows DR-0060 tenancy scoping.',
      readPaths: ['/repo/docs/decisions/DR-0060-tenancy-guard-data-isolation-gate.md'],
    });
    expect(out.ok).toBe(true);
  });

  it('passes when the DR was read via grep across the decisions dir', () => {
    const out = checkCitedButUnread({
      claimText: 'Per DR-0111 we do the work.',
      shellText: ['grep -n "usurp" docs/decisions/DR-0111-do-the-work.md'],
    });
    expect(out.ok).toBe(true);
  });
});

describe('it must NOT cry wolf — a noisy guard gets disabled, and then protects nothing', () => {
  it('ignores ordinary prose with no citations', () => {
    expect(checkCitedButUnread({ claimText: 'I built the surface and ran the tests.' }).ok).toBe(true);
  });

  it('ignores short or single-segment filenames that are not foundation docs', () => {
    const out = checkCitedButUnread({ claimText: 'See README.md and API.md for details.' });
    expect(out.ok).toBe(true);
  });

  it('does not fire on lowercase source files', () => {
    const out = checkCitedButUnread({ claimText: 'Edited app/src/lib/table-sync.js and photos_archive.py.' });
    expect(out.ok).toBe(true);
  });

  it('passes on empty, null and junk input rather than blocking', () => {
    for (const bad of [undefined, null, '', 42, {}]) {
      expect(checkCitedButUnread(bad === undefined ? undefined : { claimText: bad }).ok).toBe(true);
    }
  });
});

describe('reading the evidence out of a real transcript shape', () => {
  it('pulls Read file_paths and Bash commands from JSONL tool_use events', () => {
    const lines = [
      JSON.stringify({ message: { content: [
        { type: 'tool_use', name: 'Read', input: { file_path: '/repo/docs/00-foundations/_root/THE-WAY.md' } },
      ] } }),
      JSON.stringify({ message: { content: [
        { type: 'tool_use', name: 'Bash', input: { command: 'cat docs/decisions/DR-0076-verification.md' } },
      ] } }),
      'not json at all',
      JSON.stringify({ message: { content: 'a bare string, not an array' } }),
    ];
    const { paths, shell } = readEvidenceFromTranscript(lines);
    expect(paths).toContain('/repo/docs/00-foundations/_root/THE-WAY.md');
    expect(shell.join(' ')).toMatch(/DR-0076/);
  });

  it('survives a garbage transcript without throwing', () => {
    expect(() => readEvidenceFromTranscript(['{', null, 5])).not.toThrow();
    expect(readEvidenceFromTranscript(null)).toEqual({ paths: [], shell: [] });
  });

  it('end-to-end: transcript evidence clears a citation that would otherwise block', () => {
    const lines = [JSON.stringify({ message: { content: [
      { type: 'tool_use', name: 'Read', input: { file_path: 'docs/00-foundations/_root/EXCELLENCE-STANDARD.md' } },
    ] } })];
    const { paths, shell } = readEvidenceFromTranscript(lines);
    const out = checkCitedButUnread({
      claimText: 'Held to the EXCELLENCE-STANDARD.md bar.', readPaths: paths, shellText: shell,
    });
    expect(out.ok).toBe(true);
  });
});

describe('the message tells the agent what to DO', () => {
  it('names the unread docs and both acceptable remedies', () => {
    const msg = citedButUnreadReason(['THE-WAY.md']);
    expect(msg).toMatch(/THE-WAY\.md/);
    expect(msg).toMatch(/Read them now/);
    expect(msg).toMatch(/drop the citation/);
  });
});
