// =============================================================================
// statement-import — client-side OFX/QFX parsing (the "never leaves your device"
// promise made true). The landing "Drop your bank file" upload promised browser-
// only reading ("we read it in your browser, nothing saves") while the wired path
// POSTed the raw statement text to an n8n webhook — a broken promise on the money
// surface where trust IS the product, and n8n is being retired anyway. parseOfx
// reads OFX/QFX entirely in-browser into the same normalized rows shape the CSV
// path produces, under the same reconciliation gate (no row silently vanishes).
//
// PROVEN-TO-CATCH (DR-0076): a real 3-transaction OFX fixture must parse to 3
// correct rows; the SGML tag style (no closing tags) AND the XML style must both
// work; a block with a bad amount/date must be REJECTED (counted), not dropped —
// ingested + rejected === source total. Break the parser and these go red.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { parseOfx, parseStatementText, isOfxFile } from '../lib/statement-import.js';

// A real-shaped OFX (SGML style — tags have no closing tag, as most banks export).
const OFX_SGML = `OFXHEADER:100
DATA:OFXSGML
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260703120000<TRNAMT>-42.17<NAME>KROGER FUEL<MEMO>Pump 4</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260705<TRNAMT>1500.00<NAME>PAYROLL ACH</STMTTRN>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260706<TRNAMT>-9.99<NAME>SPOTIFY</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

// XML-2 style (closing tags present) — must parse identically.
const OFX_XML = `<OFX><STMTTRN><DTPOSTED>20260701</DTPOSTED><TRNAMT>-25.00</TRNAMT><NAME>COFFEE</NAME></STMTTRN></OFX>`;

describe('parseOfx — real statements, fully in-browser', () => {
  it('parses every transaction in an SGML OFX into normalized rows', () => {
    const { rows, reconciliation } = parseOfx(OFX_SGML);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ date: '2026-07-03', description: 'KROGER FUEL', amount: -42.17 });
    expect(rows[1]).toMatchObject({ date: '2026-07-05', description: 'PAYROLL ACH', amount: 1500 });
    expect(rows[2]).toMatchObject({ date: '2026-07-06', description: 'SPOTIFY', amount: -9.99 });
    // Reconciliation gate: nothing vanished.
    expect(reconciliation.balanced).toBe(true);
    expect(reconciliation.sourceTotal).toBe(3);
  });

  it('parses the XML tag style identically (closing tags present)', () => {
    const { rows } = parseOfx(OFX_XML);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ date: '2026-07-01', description: 'COFFEE', amount: -25 });
  });

  it('flipSign inverts amounts (card exports where a charge is positive)', () => {
    const { rows } = parseOfx(OFX_XML, { flipSign: true });
    expect(rows[0].amount).toBe(25);
  });

  it('REJECTS a bad block (counted, not silently dropped) so the total balances', () => {
    const bad = `<OFX>
<STMTTRN><DTPOSTED>20260701<TRNAMT>-5.00<NAME>GOOD</STMTTRN>
<STMTTRN><DTPOSTED>NOTADATE<TRNAMT>-5.00<NAME>BADDATE</STMTTRN>
<STMTTRN><DTPOSTED>20260702<TRNAMT>notanumber<NAME>BADAMT</STMTTRN>
</OFX>`;
    const { rows, rejected, reconciliation } = parseOfx(bad);
    expect(rows).toHaveLength(1);
    expect(rejected).toHaveLength(2);
    expect(rejected.map((r) => r.reason)).toEqual(['unreadable-date', 'unparseable-amount']);
    expect(reconciliation.balanced).toBe(true);      // 1 ingested + 2 rejected === 3 source
    expect(reconciliation.sourceTotal).toBe(3);
  });

  it('honest empty result on a non-OFX file (no crash, named error)', () => {
    const { rows, errors } = parseOfx('this is not an ofx file at all');
    expect(rows).toHaveLength(0);
    expect(errors[0]).toMatch(/does not look like an OFX/i);
  });
});

describe('parseStatementText — routes OFX to parseOfx, CSV to the delimited path', () => {
  it('auto-detects OFX by content', () => {
    expect(parseStatementText(OFX_XML).rows).toHaveLength(1);
  });
  it('sends CSV to the delimited parser', () => {
    const csv = 'Date,Description,Amount\n2026-07-01,Store,-3.50';
    const { rows } = parseStatementText(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ date: '2026-07-01', description: 'Store', amount: -3.5 });
  });
});

describe('isOfxFile — recognizes .ofx/.qfx by name', () => {
  it('matches ofx and qfx extensions, rejects csv', () => {
    expect(isOfxFile({ name: 'stmt.ofx' })).toBe(true);
    expect(isOfxFile({ name: 'export.QFX' })).toBe(true);
    expect(isOfxFile({ name: 'data.csv' })).toBe(false);
  });
});
