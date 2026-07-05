// watchlist-sync — pure merge/normalize logic for the Markets ticker rail
// (0077 market_watchlist). No network.
import { describe, it, expect } from 'vitest';
import { normalizeSymbol, mergeWatchlists } from '../lib/watchlist-sync.js';

describe('normalizeSymbol', () => {
  it('lowercases and trims (matches the add reducer)', () => {
    expect(normalizeSymbol('  SPY.US ')).toBe('spy.us');
    expect(normalizeSymbol('')).toBe('');
    expect(normalizeSymbol(null)).toBe('');
  });
});

describe('mergeWatchlists — remote ∪ local, remote order first, deduped', () => {
  it('keeps remote order, appends local-only symbols', () => {
    expect(mergeWatchlists(['btcusd', 'nvda.us'], ['spy.us', 'btcusd'])).toEqual([
      'spy.us', 'btcusd', 'nvda.us',
    ]);
  });
  it('dedupes case/whitespace variants of the same symbol', () => {
    expect(mergeWatchlists([' SPY.US '], ['spy.us'])).toEqual(['spy.us']);
  });
  it('drops empty entries and handles missing lists', () => {
    expect(mergeWatchlists(['', null, 'qqq.us'], undefined)).toEqual(['qqq.us']);
    expect(mergeWatchlists()).toEqual([]);
  });
});
