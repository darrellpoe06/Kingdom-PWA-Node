// =============================================================================
// food-parse — one sentence into its separate foods
// =============================================================================
// Pinned against DARRELL'S OWN SENTENCE, verbatim, because that is the case the
// feature exists for. The hard part is the delimiter-free run at the end:
// "pickles onions olives hot peppers avocado spread" must become five foods with
// "hot peppers" and "avocado spread" intact -- not nine words, and not one absurd
// item.
//
// The other property under test is what this module must NEVER do: produce a
// calorie or protein number. Splitting is language; nutrition is a claim that
// only the person's own confirmed entries or a cited lookup may make (DR-0076).
import { describe, it, expect } from 'vitest';
import { parseFoodLine, normalizeName, resolveFromLibrary, unknownCount } from '../lib/food-parse.js';

const DARRELL = 'a 6 inch subway turkey sandwich with white bread, mayo tomatoes, pickles onions olives hot peppers avocado spread';

describe("Darrell's sentence, verbatim", () => {
  const items = parseFoodLine(DARRELL);

  it('finds every food he named, and no extras', () => {
    expect(items.map((i) => i.name)).toEqual([
      'subway turkey sandwich', 'white bread', 'mayo', 'tomatoes',
      'pickles', 'onions', 'olives', 'hot peppers', 'avocado spread',
    ]);
  });

  it('keeps the size with the thing it sizes', () => {
    expect(items[0].serving).toBe('6 inch');
    expect(items[0].name).toBe('subway turkey sandwich');
  });

  it('PROVEN-TO-CATCH: multi-word foods survive the delimiter-free run', () => {
    const names = items.map((i) => i.name);
    expect(names).toContain('hot peppers');
    expect(names).toContain('avocado spread');
    // the failure mode this guards: splitting on spaces
    expect(names).not.toContain('hot');
    expect(names).not.toContain('spread');
    expect(names).not.toContain('avocado');
  });

  it('invents no nutrition — that is not this module’s job', () => {
    for (const i of items) {
      expect(i.calories).toBeUndefined();
      expect(i.proteinG).toBeUndefined();
    }
  });
});

describe('splitting', () => {
  it('splits on commas and on joining words', () => {
    expect(parseFoodLine('eggs and toast').map((i) => i.name)).toEqual(['eggs', 'toast']);
    expect(parseFoodLine('salmon, broccoli').map((i) => i.name)).toEqual(['salmon', 'broccoli']);
  });
  it('strips filler without eating the food', () => {
    expect(parseFoodLine('I ate a banana').map((i) => i.name)).toEqual(['banana']);
  });
  it('keeps an unrecognised food rather than dropping it', () => {
    const names = parseFoodLine('kimchi pancake').map((i) => i.name);
    expect(names.join(' ')).toContain('kimchi');
  });
  it('returns nothing for nothing, never a blank row', () => {
    expect(parseFoodLine('')).toEqual([]);
    expect(parseFoodLine('   ')).toEqual([]);
    expect(parseFoodLine(null)).toEqual([]);
  });
  it('does not log the same food twice from one line', () => {
    expect(parseFoodLine('olives, olives').length).toBe(1);
  });
  it('normalizes names for matching', () => {
    expect(normalizeName('  Turkey   Breast ')).toBe('turkey breast');
  });
});

describe('resolving against what the person already confirmed', () => {
  const library = [
    { name: 'Olives', serving: '5', calories: 25, proteinG: 0.2 },
    { name: 'white bread', serving: '2 slices', calories: 160, proteinG: 6 },
  ];

  it('fills in a remembered food and says where it came from', () => {
    const [olives] = resolveFromLibrary(parseFoodLine('olives'), library);
    expect(olives.calories).toBe(25);
    expect(olives.known).toBe(true);
    expect(olives.source).toBe('remembered');
  });

  it('matches case-insensitively', () => {
    expect(resolveFromLibrary([{ name: 'OLIVES', serving: '' }], library)[0].calories).toBe(25);
  });

  it('PROVEN-TO-CATCH: an unknown food stays NULL, never 0', () => {
    const [x] = resolveFromLibrary([{ name: 'dragonfruit', serving: '' }], library);
    expect(x.calories).toBeNull();      // a 0 here would silently under-count the day
    expect(x.proteinG).toBeNull();
    expect(x.known).toBe(false);
    expect(x.source).toBeNull();
  });

  it('counts what still needs a number from the person', () => {
    const resolved = resolveFromLibrary(parseFoodLine('olives, dragonfruit, white bread'), library);
    expect(unknownCount(resolved)).toBe(1);
  });

  it('keeps the serving the person typed over the remembered one', () => {
    const [b] = resolveFromLibrary([{ name: 'white bread', serving: '1 slice' }], library);
    expect(b.serving).toBe('1 slice');
  });

  it('survives an empty or missing library', () => {
    expect(resolveFromLibrary(parseFoodLine('olives'), [])[0].known).toBe(false);
    expect(resolveFromLibrary(parseFoodLine('olives'), null)[0].known).toBe(false);
  });
});
