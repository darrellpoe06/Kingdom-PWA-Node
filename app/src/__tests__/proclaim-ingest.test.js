// @vitest-environment node
// Pins proclaimToRows — the glue that turns one PROCLAIM email (subject + .docx
// text) into the choir_sermons + sermon_prep rows The Word reads. Composes the
// two verified parsers; ground-truth (source:'email', needs_review:false).
import { describe, it, expect } from 'vitest';
import { proclaimToRows } from '../lib/proclaim-ingest.js';

// A minimal .docx-shaped prep body in BG's real format: a headline anchor ref,
// then numbered points, each with its scripture.
const DOCX = [
  'MATTHEW 5:13-16 NIV',
  '',
  '1. You are the salt of the earth. Matthew 5:13',
  '2. You are the light of the world. Matthew 5:14',
  '3. Let your light shine before others. Matthew 5:16',
].join('\n');

describe('proclaimToRows — PROCLAIM email -> the two Word rows', () => {
  it('builds the sermon row from the subject metadata', () => {
    const { sermon } = proclaimToRows(
      "06-17-2026 PROCLAIM SCRIPTURES AND POINTS - I.M SALTY! - MATTHEW 5.13-16 NIV - CHILDREN.S DAY - PROFESSOR PETE AND PASTOR AARON FORMAN.docx",
      DOCX,
      { instanceId: 'colg-1' },
    );
    expect(sermon.title).toBe("I'M SALTY!");
    expect(sermon.scripture_ref).toBe('MATTHEW 5:13-16');
    expect(sermon.service_date).toBe('2026-06-17');
    expect(sermon.service_type).toBe('wednesday'); // 2026-06-17 is a Wednesday
    expect(sermon.speaker).toMatch(/PROFESSOR PETE/);
    expect(sermon.source).toBe('email');
    expect(sermon.status).toBe('draft');
    expect(sermon.instance_id).toBe('colg-1');
  });

  it('builds the prep row as GROUND TRUTH (source email, not needing review)', () => {
    const { prep } = proclaimToRows("06-17-2026 PROCLAIM - I.M SALTY! - MATTHEW 5.13-16 NIV", DOCX, { instanceId: 'colg-1' });
    expect(prep.points.length).toBe(3);
    expect(prep.points[0].text).toMatch(/salt of the earth/i);
    expect(prep.source).toBe('email');
    expect(prep.needs_review).toBe(false);
    // scriptures merge the headline ref + the doc refs, deduped.
    expect(prep.scriptures).toContain('MATTHEW 5:13-16');
  });

  it('defaults the speaker to Bishop Gwin when none is named', () => {
    const { sermon } = proclaimToRows('06-14-2026 PROCLAIM - ARE YOU SALTY? - MATTHEW 5.13 NIV', DOCX, {});
    expect(sermon.speaker).toBe('Bishop Lloyd E. Gwin');
    expect(sermon.service_type).toBe('sunday'); // 2026-06-14 is a Sunday
  });

  it('never throws on empty input', () => {
    const { sermon, prep } = proclaimToRows('', '', {});
    expect(sermon.title).toBeNull();
    expect(prep.points).toEqual([]);
    expect(prep.needs_review).toBe(false);
  });
});
