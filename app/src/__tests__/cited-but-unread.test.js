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

// =============================================================================
// THE POINTER IS NOT A CITATION — the live 2026-10-09 false positive
// =============================================================================
// Shipping L223, the reply reported the ledger's own `**Next ID:** DR-0835` to
// prove the claim had landed, and the guard blocked it. The number named the
// next UNCLAIMED record, so no file for it existed or could be read. The guard
// fired on a true statement, which costs the same trust as missing a real one.
//
// Both directions are pinned here on purpose: the fix must not buy quiet by
// letting the original incident through.
// =============================================================================
describe('the ledger pointer is a value, not a claim to have read something', () => {
  it('does NOT fire on the Next ID pointer, which has no record by definition', () => {
    const out = checkCitedButUnread({
      claimText: "main's ledger pointer now reads **Next ID:** DR-0835.",
      readPaths: [],
      nextDrId: '0835',
    });
    expect(out.ok).toBe(true);
    expect(out.unread).toEqual([]);
  });

  it('does not fire on a forward id above the pointer either', () => {
    const out = checkCitedButUnread({
      claimText: 'The next lesson will claim DR-0836 or DR-0840.',
      nextDrId: '0835',
    });
    expect(out.ok).toBe(true);
  });

  it('accepts the pointer written as DR-0835, the way the hook may hand it over', () => {
    expect(checkCitedButUnread({ claimText: 'Pointer DR-0835.', nextDrId: 'DR-0835' }).ok).toBe(true);
  });

  it('PROVEN-TO-CATCH: an unread record BELOW the pointer still blocks', () => {
    const out = checkCitedButUnread({
      claimText: 'This follows DR-0060, and the pointer is at DR-0835.',
      readPaths: ['/repo/CLAUDE.md'],
      nextDrId: '0835',
    });
    expect(out.ok).toBe(false);
    expect(out.unread).toEqual(['DR-0060']);   // the real record
  });

  it('PROVEN-TO-CATCH: the pointer never excuses the id just below it', () => {
    const out = checkCitedButUnread({ claimText: 'Per DR-0834.', nextDrId: '0835' });
    expect(out.ok).toBe(false);
    expect(out.unread).toEqual(['DR-0834']);
  });

  it('a record that WAS read passes, pointer present or not', () => {
    const out = checkCitedButUnread({
      claimText: 'Per DR-0834, and the pointer is DR-0835.',
      readPaths: ['/repo/docs/decisions/DR-0834-the-storm.md'],
      nextDrId: '0835',
    });
    expect(out.ok).toBe(true);
  });

  // MEASURED AGAINST THE REAL LEDGER, and the reason the fix stops at the
  // pointer. A wider rule — "below the pointer with no file means invented" —
  // was built, measured, and REJECTED: 57 ids have no file yet are legitimately
  // citable. DR-0017..DR-0049 are the pre-file-convention era recorded in
  // session notes (docs/reviews/REVIEWS.md:263); DR-0655 and others are claimed
  // by branches still in flight. So a gap below the pointer must keep being
  // treated as an ordinary citation, never as a fabrication.
  it('treats a FILE-LESS id below the pointer as an ordinary citation, not a fabrication', () => {
    const preConvention = checkCitedButUnread({ claimText: 'Per DR-0017.', nextDrId: '0835' });
    expect(preConvention.unread).toEqual(['DR-0017']);   // unread, which a read of the notes clears

    const cleared = checkCitedButUnread({
      claimText: 'Per DR-0017 the workforce layer is the engine.',
      shellText: ['grep -n "DR-0017" docs/99-session-notes/2026-06-09-poetech-market-strategy.md'],
      nextDrId: '0835',
    });
    expect(cleared.ok).toBe(true);
  });
});

describe('WITHOUT the pointer, nothing is relaxed — a caller that cannot read it must not weaken the gate', () => {
  it('polices every cited id exactly as before when no pointer is supplied', () => {
    const out = checkCitedButUnread({ claimText: 'Per DR-0835 and DR-0400.', readPaths: [] });
    expect(out.ok).toBe(false);
    expect(out.unread).toEqual(['DR-0400', 'DR-0835']);
  });

  it('polices normally when the pointer is unreadable junk', () => {
    for (const bad of ['not-a-number', '', null, undefined, {}]) {
      const out = checkCitedButUnread({ claimText: 'Per DR-0835.', nextDrId: bad });
      expect(out.unread).toEqual(['DR-0835']);
    }
  });

  it('a foundation doc is judged by the doc list, never by the ledger pointer', () => {
    const out = checkCitedButUnread({
      claimText: 'Held to EXCELLENCE-STANDARD.md, pointer DR-0835.',
      knownDocs: ['EXCELLENCE-STANDARD.md'],
      nextDrId: '0835',
    });
    expect(out.ok).toBe(false);
    expect(out.unread).toEqual(['EXCELLENCE-STANDARD.md']);
  });
});
