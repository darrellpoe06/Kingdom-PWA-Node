// order-import — the paste-from-email order-of-service parser. Locks the
// derivation the ServiceProgram import surface depends on (DR-0076): every
// segment traces to a pasted line, noise is skipped and SURFACED, nothing is
// invented.
import { describe, it, expect } from 'vitest';
import { parseEmailOrder } from '../lib/order-import.js';

describe('parseEmailOrder', () => {
  it('returns empty shape on empty / non-string input', () => {
    expect(parseEmailOrder('')).toEqual({ segments: [], skipped: [], startTime: null });
    expect(parseEmailOrder(null)).toEqual({ segments: [], skipped: [], startTime: null });
    expect(parseEmailOrder('   \n  \n')).toEqual({ segments: [], skipped: [], startTime: null });
  });

  it('parses a realistic emailed order into segments with sectors', () => {
    const email = [
      'PRAISE GOD!!!',
      '1. Call to Worship',
      '2. Praise & Worship (20 min)',
      '3. Welcome & Announcements',
      '4. Offering',
      '5. Choir Selection',
      '6. Scripture Reading — 2 Kings 9:30-37',
      '7. Sermon — Pastor Ken McCray',
      '8. Altar Call',
      '9. Benediction',
      'Senior Bishop Lloyd E. Gwin',
      '(217) 359-6920',
      'www.thechurchofthelivinggod.com',
      '312 E. Bradley Avenue | Champaign, IL 61820',
    ].join('\n');
    const { segments, skipped } = parseEmailOrder(email);
    expect(segments.map((s) => s.title)).toEqual([
      'Call to Worship', 'Praise & Worship', 'Welcome & Announcements', 'Offering',
      'Choir Selection', 'Scripture Reading', 'Sermon', 'Altar Call', 'Benediction',
    ]);
    const byTitle = Object.fromEntries(segments.map((s) => [s.title, s]));
    expect(byTitle['Call to Worship'].sector).toBe('pulpit');
    expect(byTitle['Praise & Worship'].sector).toBe('worship');
    expect(byTitle['Welcome & Announcements'].sector).toBe('hospitality');
    expect(byTitle['Offering'].sector).toBe('ushers');
    expect(byTitle['Choir Selection'].sector).toBe('worship');
    expect(byTitle['Scripture Reading'].sector).toBe('pulpit');
    expect(byTitle['Sermon'].sector).toBe('pulpit');
    expect(byTitle['Altar Call'].sector).toBe('pastoral');
    expect(byTitle['Benediction'].sector).toBe('pulpit');
    // Greeting + the 4-line signature block are skipped, surfaced, not inserted.
    expect(skipped.length).toBe(5);
  });

  it('keeps the sermon FIXED so reflow never compresses the Word', () => {
    const { segments } = parseEmailOrder('Sermon — Pastor McCray\nPraise & Worship');
    const sermon = segments.find((s) => s.title === 'Sermon');
    expect(sermon.flexible).toBe(false);
    expect(sermon.plannedMinutes).toBe(35);
    expect(segments.find((s) => s.title === 'Praise & Worship').flexible).toBe(true);
  });

  it('extracts explicit minutes and strips them from the title', () => {
    const { segments } = parseEmailOrder('Praise & Worship (20 min)\nOffering - 7 minutes');
    expect(segments[0]).toMatchObject({ title: 'Praise & Worship', plannedMinutes: 20 });
    expect(segments[1]).toMatchObject({ title: 'Offering', plannedMinutes: 7 });
  });

  it('extracts a trailing owner name after a dash or "by"', () => {
    const { segments } = parseEmailOrder('Sermon — Pastor Ken McCray\nSolo by Sister Evelyn Moore');
    expect(segments[0]).toMatchObject({ title: 'Sermon', ownerName: 'Pastor Ken McCray' });
    expect(segments[1]).toMatchObject({ title: 'Solo', ownerName: 'Sister Evelyn Moore' });
  });

  it('extracts a scripture reference into scriptureRef', () => {
    const { segments } = parseEmailOrder('Scripture Reading — 2 Kings 9:30-37\nSermon Matthew 1:18-21');
    expect(segments[0]).toMatchObject({ title: 'Scripture Reading', scriptureRef: '2 Kings 9:30-37' });
    expect(segments[1].scriptureRef).toBe('Matthew 1:18-21');
  });

  it('captures the first clock time as the suggested start', () => {
    const { segments, startTime } = parseEmailOrder('11:00 AM Call to Worship\n11:05 Praise & Worship');
    expect(startTime).toBe('11:00');
    expect(segments[0].title).toBe('Call to Worship');
    expect(segments[1].title).toBe('Praise & Worship');
  });

  it('converts PM clock times to 24h', () => {
    const { startTime } = parseEmailOrder('7:30 PM Midweek Prayer');
    expect(startTime).toBe('19:30');
  });

  it('assigns spaced sortOrder so hand-inserts fit between lines', () => {
    const { segments } = parseEmailOrder('Call to Worship\nOffering\nBenediction');
    expect(segments.map((s) => s.sortOrder)).toEqual([10, 20, 30]);
  });

  it('skips lines with no letters (dates, separators) instead of inserting garbage', () => {
    const { segments, skipped } = parseEmailOrder('***\n07/05/2026\nOffering');
    expect(segments.map((s) => s.title)).toEqual(['Offering']);
    expect(skipped.length).toBe(2);
  });

  it('produces the seedDefaultOrder template shape (insertable rows)', () => {
    const { segments } = parseEmailOrder('Offering');
    expect(segments[0]).toEqual({
      title: 'Offering', sector: 'ushers', ownerName: '', plannedMinutes: 5,
      flexible: true, sortOrder: 10, scriptureRef: '', sermonId: null,
      songIds: [], cues: {}, notes: '',
    });
  });
});
