// 170 tester entries, and about 160 of them drew as an empty box.
//
// Darrell's two screenshots of About -> Tester feedback (2026-09-22) show rows
// carrying only a date and an x. Three rows had content, and all three were the
// OLD modal shape (CHURCH . ROUGH with "+ MISSING", CHURCH . NOT WORKING).
//
// The data was never missing. Every `addFeedback` call site writes `text`
// (poe-financial-mvp-v28.jsx:2922 and its callers at 4570, 4582, 4616, 4655,
// 4688, 4726, 4740, 4749 ...); the cloud round-trip writes `feedback_text`
// (lib/feedback-sync.js); only the retired modal wrote the
// whatsWorking/whatsNot/whatsMissing triple. The About list rendered ONLY that
// triple, so every modern entry had a body the surface never read.
//
// What that cost is not cosmetic. Among the blank rows are parishioners tapping
// to join the youth A.I. class, the broadcast course, the infrastructure course
// and the Sovereign A.I. course — real people raising a hand, invisible to the
// person reading the log. That is DR-0381's class exactly: a surface that shows
// nothing while real data sits behind it is a lie, not an empty state.
//
// These cases hold the guarantee at the SHARED extractor and at the row.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { feedbackText, feedbackScreenshotCount } from '../lib/feedback-triage.js';

const ABOUT = readFileSync(resolve(__dirname, '../components/About.jsx'), 'utf8');

// The exact record shape a course-interest tap produces, from the real call site.
const INTEREST_TAP = {
  id: 'f1',
  area: 'church-learn',
  rating: 'love',
  category: 'feature-request',
  text: '[class-interest] A parishioner wants to join the youth A.I. class.',
  createdAt: '2026-09-14T12:00:00Z',
};

// The old modal's shape, which DID render before this fix.
const LEGACY_TRIPLE = {
  id: 'f2',
  area: 'church',
  whatsNot: 'I added the information under tab for the choir under schedule. When I said add, it went away.',
  createdAt: '2026-06-17T12:00:00Z',
};

// What the cloud hands back after a round trip.
const FROM_CLOUD = {
  id: 'f3',
  which_tab: 'church-learn',
  feedback_text: 'The read aloud stops at the end and will not start over.',
  createdAt: '2026-09-16T12:00:00Z',
};

describe('the tester log reads the body through the shared extractor, not off one field', () => {
  it('REPRODUCES THE DEFECT: the three legacy fields alone leave a real entry with nothing to show', () => {
    // This is what the old row did — read only the triple.
    const legacyOnlyRender = (f) => [f.whatsWorking, f.whatsNot, f.whatsMissing].filter(Boolean).join(' ');
    expect(legacyOnlyRender(INTEREST_TAP)).toBe('');      // a real hand raised, drawn blank
    expect(legacyOnlyRender(FROM_CLOUD)).toBe('');        // a real bug report, drawn blank
    expect(legacyOnlyRender(LEGACY_TRIPLE)).not.toBe(''); // and only the old shape survived
  });

  it('the shared extractor finds the body in every shape the app actually writes', () => {
    expect(feedbackText(INTEREST_TAP)).toContain('youth A.I. class');
    expect(feedbackText(FROM_CLOUD)).toContain('read aloud stops');
    expect(feedbackText(LEGACY_TRIPLE)).toContain('it went away');
  });

  it('About.jsx calls that extractor — it does not re-implement the field walk', () => {
    expect(ABOUT).toMatch(/import \{[^}]*feedbackText[^}]*\} from '\.\.\/lib\/feedback-triage\.js'/);
    expect(ABOUT).toMatch(/const body = String\(feedbackText\(f\) \|\| ''\)\.trim\(\)/);
  });

  it('the row renders that body', () => {
    expect(ABOUT).toContain('data-testid="feedback-body"');
    expect(ABOUT).toMatch(/\{body\}<\/p>/);
  });

  it('a legacy triple keeps its own labels rather than being flattened into one line', () => {
    // Both halves matter to a reader: what worked AND what did not.
    expect(ABOUT).toContain('✓ Working');
    expect(ABOUT).toContain('✗ Not working');
    expect(ABOUT).toContain('+ Missing');
    // and the composed body is suppressed when the labelled fields are present,
    // so the same words never appear twice in one row.
    expect(ABOUT).toMatch(/!hasLegacyTriple && body/);
  });

  it('an unlabelled entry still says which area it came from, or says it is unlabelled', () => {
    // The blank rows had no area chip at all, so a reader could not even tell
    // where the report came from.
    expect(ABOUT).toMatch(/f\.area \|\| f\.currentView \|\| f\.which_tab \|\| 'unlabelled'/);
  });
});

describe('a picture is announced, and a truly empty submission says so', () => {
  it('counts screenshots across every shape the row can arrive in', () => {
    expect(feedbackScreenshotCount({ screenshots: ['a', 'b'] })).toBe(2);
    expect(feedbackScreenshotCount({ screenshotCount: 3 })).toBe(3);
    expect(feedbackScreenshotCount({ hasScreenshot: true })).toBe(1);
    expect(feedbackScreenshotCount({ screenshot: 'data:image/jpeg;base64,x' })).toBe(1);
    expect(feedbackScreenshotCount({})).toBe(0);
    expect(feedbackScreenshotCount()).toBe(0);
  });

  it('a screenshot-only entry is announced instead of drawn blank', () => {
    // This is the case the list could never show: no words, one picture.
    const shotOnly = { id: 'f4', area: 'church', screenshots: ['data:image/jpeg;base64,x'] };
    expect(feedbackText(shotOnly)).toBe('');
    expect(feedbackScreenshotCount(shotOnly)).toBe(1);
    expect(ABOUT).toContain('data-testid="feedback-shots"');
    expect(ABOUT).toMatch(/screenshot\{shots > 1 \? 's' : ''\} attached/);
  });

  it('an entry with no words and no picture SAYS that, rather than rendering an empty box', () => {
    expect(ABOUT).toContain('data-testid="feedback-empty"');
    expect(ABOUT).toContain('No words and no screenshot were submitted with this one.');
    expect(ABOUT).toMatch(/!hasLegacyTriple && !body && shots === 0/);
  });

  it('the screenshot counter has ONE implementation, so a second surface cannot drift', () => {
    const lib = readFileSync(resolve(__dirname, '../lib/feedback-triage.js'), 'utf8');
    expect(lib).toMatch(/export function feedbackScreenshotCount/);
    // the module-private helper delegates rather than duplicating the field walk
    expect(lib).toMatch(/function screenshotCount\(item\) \{\s*return feedbackScreenshotCount\(item\);/);
  });
});
