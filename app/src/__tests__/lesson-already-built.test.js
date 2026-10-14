// @vitest-environment node
// =============================================================================
// lesson-already-built — the DR-0610 check, made a tool
// =============================================================================
// WHY, MEASURED. DR-0610 is one teaching, one lesson, and the Gmail intake
// routine enforces it by having the agent grep the catalogs and the ledger by
// hand on every firing — three a day, for as long as a thread sits unlabelled.
// On 2026-10-14 the same thread (the ByteByteGo positional-encoding article,
// already built as sov39 under DR-1005) was checked by hand on two consecutive
// ticks, four steps each time, same answer.
//
// The routine records what that check is worth: on 2026-10-11 a broken
// `-label:Label_22` exclusion returned 12 threads that were every one already
// captured, and taken at face value that firing "would have built TWELVE
// DUPLICATE LESSONS". The catalog check is what stands between a stale label
// and twelve duplicates in the congregation's app.
//
// THE DEFECT THE FIRST VERSION HAD, found by running it on the real case. It
// accepted a BARE DAY as its strongest signal, so it answered "ALREADY BUILT"
// on the strength of `2026-10-13` appearing in dozens of records that merely
// mention that date — while DR-1005, the one true match, did not make the top
// eight. A right verdict resting on worthless evidence is the looks-fine-but-
// isn't failure DR-0076 exists to stop, and it would have taught the next
// reader to trust a coincidence. A bare day is now only a signal ALONGSIDE the
// source name, and that pair is its own, lesser strength.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  normalise, distinctiveTerms, dateForms, bareDay, scoreFile, lessonIdsIn, findAlreadyBuilt,
} from '../../../scripts/lesson-already-built.mjs';

describe('reading the forward', () => {
  it('keeps only the uncommon words of a subject line', () => {
    const t = distinctiveTerms('How the Math Used in 19th-Century Heat Physics Helps LLMs Understand Sentences');
    expect(t).toContain('physics');
    expect(t).toContain('19th-century');
    expect(t, 'a stop-word is not distinctive').not.toContain('how');
    expect(t, 'nor is "helps"').not.toContain('helps');
    expect(t, 'nor "understand"').not.toContain('understand');
  });

  it('writes the forward instant the ways a provenance line writes it', () => {
    const forms = dateForms('2026-10-13T17:54:58Z');
    expect(forms).toContain('2026-10-13 at 17:54');
    expect(forms).toContain('2026-10-13T17:54');
    expect(forms).toContain('2026-10-13 17:54');
  });

  it('NEVER returns the bare day among those forms (proven-to-catch)', () => {
    // The whole defect: a bare day matched any record mentioning that date.
    expect(dateForms('2026-10-13T17:54:58Z')).not.toContain('2026-10-13');
    expect(bareDay('2026-10-13T17:54:58Z'), 'it is available, separately, as the weak signal').toBe('2026-10-13');
  });

  it('survives a date it cannot read', () => {
    expect(dateForms('not a date')).toEqual([]);
    expect(bareDay('not a date')).toBeNull();
  });

  it('normalises away punctuation without joining words', () => {
    expect(normalise('Heat-Physics, LLMs!')).toBe('heat-physics llms');
  });

  it('names the lessons a file mentions', () => {
    const ids = lessonIdsIn("id: 'sov39-order-carries-meaning-the-same-words' and ll242-shyness-can-be-pride");
    expect(ids).toContain('sov39-order-carries-meaning-the-same-words');
    expect(ids).toContain('ll242-shyness-can-be-pride');
  });
});

describe('how strong a match is', () => {
  const opts = { dates: ['2026-10-13 at 17:54'], day: '2026-10-13', source: 'ByteByteGo', terms: ['physics', 'llms'] };

  it('a day-and-time in the text is a timestamp match', () => {
    const s = scoreFile('Darrell forwarded a ByteByteGo article on 2026-10-13 at 17:54 UTC', opts);
    expect(s.strength).toBe('timestamp');
    expect(s.dateHit).toBe('2026-10-13 at 17:54');
  });

  it('a BARE DAY is not a timestamp match, even beside the source (proven-to-catch)', () => {
    // This is the exact shape that produced the false confidence: a record that
    // merely mentions the date, with the publication named elsewhere in it.
    const s = scoreFile('Some unrelated decision dated 2026-10-13 that cites ByteByteGo in passing', opts);
    expect(s.strength, 'the pair is reported, and reported as weaker').toBe('source+day');
    expect(s.dateHit, 'no timestamp was found').toBeNull();
  });

  it('a bare day with no source at all is weaker still', () => {
    const s = scoreFile('An unrelated record dated 2026-10-13 about physics', opts);
    expect(s.strength).toBe('terms');
  });

  it('the source alone, on another day, is only a maybe', () => {
    const s = scoreFile('A ByteByteGo article forwarded on 2026-09-02', opts);
    expect(s.strength).toBe('source');
  });

  it('no signal at all returns null, so the report stays short', () => {
    expect(scoreFile('nothing relevant whatsoever', opts)).toBeNull();
  });
});

describe('the whole search, in a real tree', () => {
  const build = () => {
    const root = mkdtempSync(join(tmpdir(), 'already-'));
    mkdirSync(join(root, 'docs/decisions'), { recursive: true });
    mkdirSync(join(root, 'app/src/lib'), { recursive: true });
    // The true match, written the way the real DR-1005 writes it.
    writeFileSync(join(root, 'docs/decisions/DR-1005-order-carries-meaning.md'),
      'source: 2026-10-13 — Darrell forwarded a ByteByteGo article into the lesson lane with one word on it, "Lesson"\n'
      + 'Darrell forwarded a ByteByteGo article on 2026-10-13 at 17:54 UTC\n'
      + "id: 'sov39-order-carries-meaning-the-same-words'\n");
    // The decoys: the same DAY, and the same SOURCE, in unrelated records.
    writeFileSync(join(root, 'docs/decisions/DR-0418-unrelated-same-day.md'),
      '**Date:** 2026-10-13\n\nnothing to do with any forward\n');
    writeFileSync(join(root, 'docs/decisions/DR-0436-same-source-other-day.md'),
      'a ByteByteGo write-up forwarded on 2026-09-02\n');
    writeFileSync(join(root, 'app/src/lib/sovereign-ai-class.js'),
      "id: 'sov20-the-book-of-remembrance' // ByteByteGo, 2026-10-13\n");
    return root;
  };

  it('answers ALREADY BUILT and puts the true match first, not a date collision', () => {
    const r = findAlreadyBuilt(build(), {
      subject: 'How the Math Used in 19th-Century Heat Physics Helps LLMs Understand Sentences',
      source: 'ByteByteGo',
      forwardedAt: '2026-10-13T17:54:58Z',
    });
    expect(r.verdict).toBe('ALREADY BUILT');
    expect(r.hits[0].file, 'the timestamp match ranks above every date collision')
      .toBe('docs/decisions/DR-1005-order-carries-meaning.md');
    expect(r.hits[0].strength).toBe('timestamp');
    expect(r.hits[0].lessons.join(' ')).toContain('sov39-order-carries-meaning');
    const timestamps = r.hits.filter((h) => h.strength === 'timestamp');
    expect(timestamps, 'exactly one file carries the forward instant').toHaveLength(1);
  });

  it('would have been fooled by the bare day before the fix (proven-to-catch)', () => {
    // Scored the old way — bare day as a timestamp — the unrelated same-day
    // record reads as the strongest possible evidence.
    const sameDay = '**Date:** 2026-10-13\n\nnothing to do with any forward\n';
    const oldWay = scoreFile(sameDay, { dates: ['2026-10-13'], source: 'ByteByteGo', terms: [] });
    expect(oldWay.strength, 'the defect, reproduced').toBe('timestamp');
    // Scored the way it works now, the same text is no evidence at all.
    const nowWay = scoreFile(sameDay, { dates: dateForms('2026-10-13T17:54:58Z'), day: bareDay('2026-10-13T17:54:58Z'), source: 'ByteByteGo', terms: [] });
    expect(nowWay, 'no source in it, no time in it, so nothing').toBeNull();
  });

  it('says NOTHING FOUND for a teaching that is genuinely unbuilt', () => {
    const r = findAlreadyBuilt(build(), {
      subject: 'A Totally Unrelated Dispatch About Beekeeping',
      source: 'SomeOtherLetter',
      forwardedAt: '2026-10-14T09:00:00Z',
    });
    expect(r.verdict).toBe('NOTHING FOUND');
    expect(r.hits).toEqual([]);
  });

  it('reports a source match on another day as a maybe rather than settled', () => {
    const r = findAlreadyBuilt(build(), { source: 'ByteByteGo', forwardedAt: '2026-08-01T10:00:00Z' });
    expect(r.verdict).toBe('MAYBE — a source match only');
  });

  it('writes nothing — it is a finder', () => {
    const root = build();
    const before = JSON.stringify(findAlreadyBuilt(root, { source: 'ByteByteGo', forwardedAt: '2026-10-13T17:54:58Z' }));
    const after = JSON.stringify(findAlreadyBuilt(root, { source: 'ByteByteGo', forwardedAt: '2026-10-13T17:54:58Z' }));
    expect(after, 'running it twice changes nothing').toBe(before);
  });
});
