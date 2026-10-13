// =============================================================================
// requirements-intake.test.js — requirements THROUGH the app, proven honest
// =============================================================================
// Pins (DR-0076 / DR-0117 contract): every item's sourceQuote is the speaker's
// LITERAL sentence; unclassifiable sentences land in `unclear`, never guessed
// into items and never dropped; nothing extracts from nothing; the output
// shape rides the existing saveExtraction rails unchanged.
import { describe, it, expect } from 'vitest';
import { splitThoughts, classifyThought, extractRequirementsFromThoughts } from '../lib/requirements-intake.js';

describe('splitThoughts — the speaker\'s words, verbatim, one statement each', () => {
  it('splits on sentences and newlines, keeps the words exact', () => {
    const raw = 'I want photo upload. The choir page is broken!\nIt should cost nothing for members.';
    expect(splitThoughts(raw)).toEqual([
      'I want photo upload.',
      'The choir page is broken!',
      'It should cost nothing for members.',
    ]);
  });
  it('empty / non-string input yields nothing', () => {
    expect(splitThoughts('')).toEqual([]);
    expect(splitThoughts(null)).toEqual([]);
  });
});

describe('classifyThought — documented precedence: pricing → requirement → pain → unclear', () => {
  it('classifies the three kinds', () => {
    expect(classifyThought('I want the family to see giving history.')).toBe('requirement');
    expect(classifyThought("The choir page can't upload photos.")).toBe('pain-point');
    expect(classifyThought('It should cost $5 per month.')).toBe('pricing');
  });
  it('a money signal outranks a requirement verb (the DR-0117 pricing kind)', () => {
    expect(classifyThought('I want to charge $50 per month for the business tier.')).toBe('pricing');
  });
  it('a requirement verb outranks a pain word (the actionable reading wins)', () => {
    expect(classifyThought('We need the login fixed because it is broken.')).toBe('requirement');
  });
  it('an unclassifiable sentence is unclear — never guessed', () => {
    expect(classifyThought('Good morning everyone.')).toBe('unclear');
  });
});

describe('extractRequirementsFromThoughts — the honest extraction', () => {
  const RAW = 'I want the family to see giving history on their phones. The choir page can\'t upload photos. Good morning saints. It should cost nothing for members.';

  it('every item carries its literal sentence as sourceQuote (the receipt)', () => {
    const out = extractRequirementsFromThoughts(RAW, { source: 'in-app-input', extractedAt: '2026-07-23T15:00:00Z' });
    expect(out.items.length).toBe(3);
    for (const it_ of out.items) {
      expect(RAW).toContain(it_.sourceQuote);      // literal substring — nothing paraphrased
      expect(it_.text).toBe(it_.sourceQuote);      // buildable text STARTS as their words
      expect(it_.status).toBe('extracted');        // steward review before anything is built
      expect(it_.confidence).toBeNull();           // never invented
      expect(it_.area).toBeNull();                 // the steward sets the area
      expect(it_.sourceRecording).toBe('in-app-input');
      expect(it_.extractedAt).toBe('2026-07-23T15:00:00Z');
    }
  });
  it('the unclassifiable sentence lands in unclear — surfaced, not guessed, not dropped', () => {
    const out = extractRequirementsFromThoughts(RAW, {});
    expect(out.unclear).toEqual(['Good morning saints.']);
  });
  it('kinds land correctly across the mixed input', () => {
    const out = extractRequirementsFromThoughts(RAW, {});
    expect(out.items.map((i) => i.kind)).toEqual(['requirement', 'pain-point', 'pricing']);
  });
  it('nothing extracts from nothing', () => {
    const out = extractRequirementsFromThoughts('', {});
    expect(out.items).toEqual([]);
    expect(out.unclear).toEqual([]);
  });
  it('output shape matches the parseDiscoveryJson contract the rails expect', () => {
    const out = extractRequirementsFromThoughts('I need offline mode.', { clientName: 'Darrell' });
    expect(Object.keys(out).sort()).toEqual(['channels', 'client', 'items', 'unclear']);
    expect(out.client.name).toBe('Darrell');
    const item = out.items[0];
    for (const k of ['kind', 'area', 'text', 'amountText', 'confidence', 'sourceQuote', 'clientName', 'businessName', 'sourceRecording', 'sourceRun', 'extractedAt', 'status']) {
      expect(k in item, `item carries ${k}`).toBe(true);
    }
  });
});
