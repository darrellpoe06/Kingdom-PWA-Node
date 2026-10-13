// @vitest-environment node
// Pins parseProclaimSubject against BG's REAL PROCLAIM subjects + attachment
// filenames (pulled live from Gmail 2026-07-14). This is the metadata half of the
// weekly email ingestion — service_date / title / scripture_ref / speaker — that
// creates the choir_sermons row; prep-outline.js fills the points. DR-0076:
// every expected value traces to real text, nothing invented.
import { describe, it, expect } from 'vitest';
import { parseProclaimSubject } from '../lib/proclaim-email.js';

describe('parseProclaimSubject — real COLG PROCLAIM emails', () => {
  it('reads the attachment filename: preached date is implicit, ref + speaker + occasion present', () => {
    const r = parseProclaimSubject("06-17-2026 PROCLAIM SCRIPTURES AND POINTS - I.M SALTY! - MATTHEW 5.13-16 NIV - CHILDREN.S DAY - PROFESSOR PETE AND PASTOR AARON FORMAN.docx");
    expect(r.serviceDate).toBe('2026-06-17');
    expect(r.title).toBe("I'M SALTY!");
    expect(r.scriptureRef).toBe('MATTHEW 5:13-16');
    expect(r.translation).toBe('NIV');
    expect(r.occasion).toBe("CHILDREN'S DAY");
    expect(r.speaker).toMatch(/PROFESSOR PETE/);
  });

  it('uses the FROM-date (preached) not the email date, and a numeral book', () => {
    const r = parseProclaimSubject("04-01-2026 PROCLAIM SCRIPTURES AND POINTS FROM 03-29-2026 SERMON - THE KING IS STILL HERE!  JOHN 12.12-13 NIV - PALM SUNDAY!");
    expect(r.serviceDate).toBe('2026-03-29');        // the SERMON date, not 04-01
    expect(r.title).toBe('THE KING IS STILL HERE!');
    expect(r.scriptureRef).toBe('JOHN 12:12-13');
    expect(r.occasion).toBe('PALM SUNDAY');
  });

  it("restores apostrophes flattened to periods, and names the guest speaker", () => {
    const r = parseProclaimSubject("03-18-2026 PROCLAIM SCRIPTURES AND POINTS FROM 03-15-2026 SERMON - GOD IS PREPARING YOU FOR YOUR DESTINY MOVE! EXODUS 17.8-14 NKJV - PASTOR KEN MCCRAY!");
    expect(r.serviceDate).toBe('2026-03-15');
    expect(r.title).toBe('GOD IS PREPARING YOU FOR YOUR DESTINY MOVE!');
    expect(r.scriptureRef).toBe('EXODUS 17:8-14');
    expect(r.translation).toBe('NKJV');
    expect(r.speaker).toMatch(/PASTOR KEN MCCRAY/);
  });

  it('handles a numeral-prefixed book (2 KINGS) + Mother’s Day', () => {
    const r = parseProclaimSubject("05-13-2026 PROCLAIM - I WILL NEVER GIVE UP! - 2 KINGS 4.18-20 NIV - MOTHER.S DAY!");
    expect(r.scriptureRef).toBe('2 KINGS 4:18-20');
    expect(r.occasion).toBe("MOTHER'S DAY");
    expect(r.title).toBe('I WILL NEVER GIVE UP!');
  });

  it('a subject with no scripture ref still yields a clean title + date (ref null, not invented)', () => {
    const r = parseProclaimSubject('06-17-2026 PROCLAIM - ARE YOU SALTY?');
    expect(r.serviceDate).toBe('2026-06-17');
    expect(r.title).toBe('ARE YOU SALTY?');
    expect(r.scriptureRef).toBeNull();
    expect(r.speaker).toBeNull();   // BG default is the caller's job, not invented here
  });

  it('tolerates the recurring typos (WSERMON / SERMOIN) in the FROM-date', () => {
    expect(parseProclaimSubject('03-10-2026 PROCLAIM SCRIPTURES AND POINTS FROM 03-08-2026 WSERMON - ONLY MOVE WHEN HE MOVES - EXODUS 13.21-22 NIV').serviceDate).toBe('2026-03-08');
    expect(parseProclaimSubject('02-04-2026 PROCLAIM SCRIPTURES AND POINTS FROM SUNDAY 02-01-2026 SERMOIN - PASTOR AARON FORMAN').scriptureRef).toBeNull();
  });

  it('empty / junk input never throws', () => {
    expect(parseProclaimSubject('').title).toBeNull();
    expect(parseProclaimSubject(null).serviceDate).toBeNull();
  });
});
