// =============================================================================
// The record opens on Notes, and nothing is buried — Darrell, 2026-08-28
// =============================================================================
// "Notes is the main reason someone or a user hits edit on the Real Estate
// tab... make the notes the top of first thing in the drop down"
// "should[n't] have to scroll unless you want more below... also the subtab
// features can be used here and that would have a better feel"
// "no... inside the records location" (circling the RECORDS button)
//
// The panel had become one stacked column ~1400px tall with Unit notes below
// photos, rooms, lease, tenants, rent and mechanical. Reordering the stack only
// moves the burial. Sub-tabs mean nothing is buried.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = () => readFileSync(join(process.cwd(), 'src/components/Rentals.jsx'), 'utf8');
const code = () => src().replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');

describe('the record is sub-tabbed, not stacked', () => {
  it('has a tab registry with Notes first', () => {
    const s = code();
    expect(s).toMatch(/const RECORD_TABS = \[/);
    const reg = s.slice(s.indexOf('const RECORD_TABS'), s.indexOf('];', s.indexOf('const RECORD_TABS')));
    const order = [...reg.matchAll(/id: '([a-z]+)'/g)].map((m) => m[1]);
    expect(order[0], 'Notes must be the first tab').toBe('notes');
    expect(order).toEqual(expect.arrayContaining(['notes', 'work', 'photos', 'property', 'tenancy']));
  });

  it('opens every record on Notes rather than remembering the last tab', () => {
    // A record that reopens wherever you left it means the next property opens
    // somewhere you did not choose.
    const s = code();
    expect(s).toMatch(/useState\('notes'\)/);
    expect(s).toMatch(/if \(opening\) setRecTab\('notes'\)/);
  });

  it('gates every heavy section behind a tab, so only one renders at a time', () => {
    const s = code();
    for (const tab of ['notes', 'work', 'photos', 'property', 'tenancy']) {
      expect(s, `no section is gated to the ${tab} tab`).toMatch(new RegExp(`recTab === '${tab}'`));
    }
    // The two biggest sections must not both be mounted at once.
    expect(s).toMatch(/recTab === 'notes' && \(<>[\s\S]{0,400}UnitManagement/);
  });

  it('keeps the sub-tabs INSIDE the opened record, not on the card header', () => {
    // Darrell circled the RECORDS button and said "no... inside the records
    // location" — the bar belongs to the panel that opens, not the row above it.
    const s = src();
    const panel = s.indexOf('openRecordsId === r.id && (');
    const bar = s.indexOf('RECORD_TABS.map');
    expect(panel).toBeGreaterThan(-1);
    expect(bar).toBeGreaterThan(panel);
  });
});

describe('the collapsed card counts what the record holds', () => {
  it('uses the shared counter, not its own three-store arithmetic', () => {
    const s = code();
    expect(s).toMatch(/recordSummary\(r, \{ photoOverride: photoCountFor\(r\) \}\)/);
    // The old line counted conversationLog and called it "notes".
    expect(s).not.toMatch(/\(r\.conversationLog \|\| \[\]\)\.length\} notes/);
  });
});
