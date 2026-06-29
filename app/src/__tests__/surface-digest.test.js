// Tests for lib/surface-digest.js — building a grounded digest of the CURRENT
// screen. Includes the end-to-end proof: a DOM with data-talk markers (as the
// Forecast Metric renders them) -> digest -> a grounded Ari explanation.
import { describe, it, expect } from 'vitest';
import {
  digestFromHelp, extractFacts, extractItems, readTitle, buildSurfaceDigest,
} from '../lib/surface-digest.js';
import { narrateDigest, verifyNarrationGrounded } from '../lib/talk-about.js';

// Build a detached DOM subtree (jsdom) from HTML for the extractors to read.
function dom(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('digestFromHelp', () => {
  it('maps a help entry to a help-kind digest', () => {
    const d = digestFromHelp({ title: 'Forecast', tag: 'Where money is headed.', what: 'It projects.', why: 'Clarity.', how: ['a', 'b'] });
    expect(d.kind).toBe('help');
    expect(d.title).toBe('Forecast');
    expect(d.lead).toBe('Where money is headed.');
    expect(d.help.how).toEqual(['a', 'b']);
  });
  it('returns null for no entry', () => {
    expect(digestFromHelp(null)).toBe(null);
  });
});

describe('extractFacts / extractItems / readTitle', () => {
  it('pulls real facts from data-talk markers (attr value wins over text)', () => {
    const root = dom(`
      <div data-talk-fact="Cash today" data-talk-value="$12,400"><span>Cash today</span><b>$12,400</b></div>
      <div data-talk-fact="Coverage" data-talk-value="22%" data-talk-delta="+4%" data-talk-status="below target">22%</div>
    `);
    const facts = extractFacts(root);
    expect(facts).toEqual([
      { label: 'Cash today', value: '$12,400' },
      { label: 'Coverage', value: '22%', delta: '+4%', status: 'below target' },
    ]);
  });

  it('falls back to element text when no data-talk-value is given', () => {
    const root = dom('<div data-talk-fact="Owed">$5,000</div>');
    expect(extractFacts(root)[0]).toEqual({ label: 'Owed', value: '$5,000' });
  });

  it('pulls items and notes', () => {
    const root = dom('<li data-talk-item="Rent due" data-talk-note="Jul 1"></li><li data-talk-item="Insurance"></li>');
    expect(extractItems(root)).toEqual([
      { label: 'Rent due', note: 'Jul 1' },
      { label: 'Insurance' },
    ]);
  });

  it('reads an explicit title, else the first heading', () => {
    expect(readTitle(dom('<h2>My Screen</h2>'))).toBe('My Screen');
    expect(readTitle(dom('<div data-talk-title="Override"></div><h2>Heading</h2>'))).toBe('Override');
  });

  it('is safe on a null/odd root', () => {
    expect(extractFacts(null)).toEqual([]);
    expect(extractItems(undefined)).toEqual([]);
    expect(readTitle(null)).toBe('');
  });
});

describe('buildSurfaceDigest — source selection', () => {
  it('prefers real on-screen facts and carries the help one-liner as lead', () => {
    const root = dom('<div data-talk-fact="Cash today" data-talk-value="$12,400"></div>');
    const d = buildSurfaceDigest({ root, helpEntry: { title: 'Forecast', tag: 'Money ahead.' } });
    expect(d.kind).toBe('dashboard');
    expect(d.facts[0].value).toBe('$12,400');
    expect(d.lead).toBe('Money ahead.');
    expect(d.title).toBe('Forecast');
  });

  it('falls back to help when there are no markers', () => {
    const d = buildSurfaceDigest({ root: dom('<p>no markers</p>'), helpEntry: { title: 'Scripture', tag: 't', what: 'w', why: 'y' } });
    expect(d.kind).toBe('help');
    expect(d.help.what).toBe('w');
  });

  it('is honestly empty when there is neither data nor help', () => {
    const d = buildSurfaceDigest({ root: dom('<p>nothing</p>') });
    expect(d.empty).toBe(true);
    expect(d.facts).toEqual([]);
  });
});

describe('END TO END: a real marked-up surface -> grounded spoken explanation', () => {
  it('narrates the actual on-screen numbers, and they are all grounded', () => {
    // Mirrors how Forecast's Metric renders: a labeled value with data-talk markers.
    const main = dom(`
      <h2>Forecast — financial engineering</h2>
      <div data-talk-fact="Cash today" data-talk-value="$12,400"><div>Cash today</div><div>$12,400</div></div>
      <div data-talk-fact="Net / month" data-talk-value="+$1,850"><div>Net / month</div><div>+$1,850</div></div>
      <div data-talk-fact="Runway" data-talk-value="14 mo"><div>Runway</div><div>14 mo</div></div>
    `);
    const digest = buildSurfaceDigest({ root: main, helpEntry: { title: 'Forecast', tag: 'Where the money is headed.' } });
    const text = narrateDigest(digest);

    expect(text).toContain('Forecast');
    expect(text).toContain('Cash today is $12,400');
    expect(text).toContain('Net / month is +$1,850');
    expect(text).toContain('Runway is 14 mo');
    // Nothing fabricated: every spoken number is on the screen.
    expect(verifyNarrationGrounded(text, digest).ok).toBe(true);
  });
});
