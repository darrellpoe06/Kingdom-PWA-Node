// @vitest-environment node
// =============================================================================
// vcard-parse — every contact in a phone's .vcf export, read exactly (DR-0736)
// =============================================================================
// The three shapes phones write (2.1 quoted-printable, 3.0 folded with item
// groups, 4.0 tel: URIs), a file that is not a vCard (fails loudly, never
// "zero contacts"), and the fields a contact keeps.
import { describe, it, expect } from 'vitest';
import { parseVCardFile, parseLine, unfoldLines, decodeQuotedPrintable, nameFromN, addressFromAdr } from '../lib/vcard-parse.js';

const V30 = [
  'BEGIN:VCARD', 'VERSION:3.0', 'N:Gwin;Lloyd;E.;Bishop;', 'FN:Bishop Lloyd E. Gwin',
  'ORG:The Church of the Living God;',
  'item1.TEL;TYPE=CELL;TYPE=pref:(217) 555-0101', 'item1.X-ABLabel:Cell',
  'TEL;TYPE=HOME:217-555-0102',
  'EMAIL;TYPE=INTERNET;TYPE=HOME:Pastor@Example.test',
  'ADR;TYPE=WORK:;;1 Church St;Champaign;IL;61820;USA',
  'NOTE:Teaches the 1 p.m. Bible study\\, every week\\; bring a notebook.',
  'END:VCARD',
  'BEGIN:VCARD', 'VERSION:3.0', 'FN:Sister Ann', 'EMAIL:ann@example.test', 'END:VCARD',
].join('\r\n');

describe('vCard 3.0 (iPhone, Google) — groups, params, escapes, several phones and emails', () => {
  it('reads every contact with its name, phones, emails, address, org and note', () => {
    const r = parseVCardFile(V30);
    expect(r.errors).toEqual([]);
    expect(r.cards).toBe(2);
    expect(r.contacts).toHaveLength(2);
    const bg = r.contacts[0];
    expect(bg.name).toBe('Bishop Lloyd E. Gwin');
    expect(bg.phones).toEqual(['(217) 555-0101', '217-555-0102']);
    expect(bg.emails).toEqual(['pastor@example.test']);
    expect(bg.addresses).toEqual(['1 Church St, Champaign, IL, 61820, USA']);
    expect(bg.org).toBe('The Church of the Living God');
    expect(bg.note).toBe('Teaches the 1 p.m. Bible study, every week; bring a notebook.');
    expect(r.contacts[1]).toMatchObject({ name: 'Sister Ann', emails: ['ann@example.test'], phones: [] });
  });

  it('unfolds a long line continued with a leading space or tab', () => {
    const folded = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:A very long\r\n  name that was folded\r\nNOTE:line one\r\n\tstill line one\r\nEND:VCARD\r\n';
    const r = parseVCardFile(folded);
    // A fold is the line break plus exactly one space or tab; both are removed.
    expect(unfoldLines('a\r\n b\r\n\tc')).toEqual(['abc']);
    expect(r.contacts[0].name).toBe('A very long name that was folded');
    expect(r.contacts[0].note).toBe('line onestill line one');
  });

  it('builds the name from N when there is no FN, in spoken order', () => {
    expect(nameFromN('Poe;Darrell;;;')).toBe('Darrell Poe');
    expect(nameFromN('Gwin;Mary;E.;Evangelist;')).toBe('Evangelist Mary E. Gwin');
    const r = parseVCardFile('BEGIN:VCARD\nVERSION:3.0\nN:Poe;Christina;;;\nTEL:5635059393\nEND:VCARD');
    expect(r.contacts[0].name).toBe('Christina Poe');
  });
});

describe('vCard 2.1 (older Android, Outlook) — quoted-printable and bare type words', () => {
  it('decodes QUOTED-PRINTABLE values and reads TEL;CELL as a phone', () => {
    expect(decodeQuotedPrintable('Jos=C3=A9 Mar=C3=ADa')).toBe('José María');
    const v21 = [
      'BEGIN:VCARD', 'VERSION:2.1',
      'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Garc=C3=ADa;Jos=C3=A9;;;',
      'TEL;CELL;VOICE:+1 (563) 650-2416',
      'EMAIL;PREF;INTERNET:jose@example.test',
      'END:VCARD',
    ].join('\r\n');
    const r = parseVCardFile(v21);
    expect(r.errors).toEqual([]);
    expect(r.contacts[0]).toMatchObject({ name: 'José García', phones: ['+1 (563) 650-2416'], emails: ['jose@example.test'], version: '2.1' });
  });

  it('parseLine keeps a colon inside a quoted parameter out of the value split', () => {
    const p = parseLine('TEL;X-NOTE="a:b":555');
    expect(p.name).toBe('TEL');
    expect(p.value).toBe('555');
    expect(p.params['X-NOTE']).toEqual(['A:B']);
  });
});

describe('vCard 4.0 — tel: and mailto: URIs', () => {
  it('strips the URI schemes and keeps the number and address', () => {
    const v4 = 'BEGIN:VCARD\nVERSION:4.0\nFN:Janelle\nTEL;VALUE=uri;PREF=1;TYPE="voice,cell":tel:+12175550199\nEMAIL:mailto:Janelle@Example.test\nEND:VCARD\n';
    const r = parseVCardFile(v4);
    expect(r.contacts[0]).toMatchObject({ name: 'Janelle', phones: ['+12175550199'], emails: ['janelle@example.test'] });
  });
});

describe('a file that is not a vCard fails loudly (DR-0076 rule 8)', () => {
  it('names the problem instead of reporting zero contacts', () => {
    const r = parseVCardFile('name,phone\nShay,2175550142\n');
    expect(r.contacts).toEqual([]);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatch(/not a contacts \(\.vcf\) file/);
  });

  it('says when the file ends in the middle of a contact', () => {
    const r = parseVCardFile('BEGIN:VCARD\nVERSION:3.0\nFN:Cut Off\n');
    expect(r.contacts).toEqual([]);
    expect(r.errors[0]).toMatch(/ends in the middle of a contact/);
  });

  it('counts a card with nothing to keep as skipped, not as a contact', () => {
    const r = parseVCardFile('BEGIN:VCARD\nVERSION:3.0\nNOTE:just a note\nEND:VCARD\n');
    expect(r.cards).toBe(1);
    expect(r.skipped).toBe(1);
    expect(r.contacts).toEqual([]);
    expect(r.errors).toEqual([]);
  });

  it('addressFromAdr joins only the parts that exist', () => {
    expect(addressFromAdr(';;1 Church St;Champaign;IL;61820;')).toBe('1 Church St, Champaign, IL, 61820');
  });
});
