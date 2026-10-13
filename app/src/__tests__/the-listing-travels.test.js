// =============================================================================
// A listing travels (DR-1004) — the link, the words, and the preview page
// =============================================================================
// Darrell: share a listing to social media; the link opens the app with that
// unit's pictures open, and the post shows the picture and the name.
import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { shareListingUrl, listingAppUrl, readListingTarget, listingShareText, LISTING_PARAM } from '../modules/properties/apply-link.js';
import { renderListingPage, describeListing, listingName, decodeDataUrl, writeListingPages, FALLBACK_IMAGE } from '../../../scripts/listing-share-pages.mjs';

const ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';
const UNIT = { id: ID, label: '805 North Prospect Avenue Apt 2', unit: 'Apt 2', city: 'Champaign', state: 'Illinois', rent: 800, weekly_rate: 200, biweekly_rate: null, nightly_rate: 150, offering: 'both', shared_home: false, rentable_level: 'unit', building_note: 'Laundry in the entry' };
// A 1x1 JPEG, base64 — enough to be bytes with the right magic.
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

describe('the link', () => {
  it('posts the static preview page for the unit, and the app is handed ?listing=<id>', () => {
    expect(shareListingUrl(ID)).toBe(`https://poetech.us/properties/l/${ID}/`);
    expect(listingAppUrl(ID)).toBe(`/properties/app/?properties=1&${LISTING_PARAM}=${ID}`);
    expect(shareListingUrl('junk')).toBe('https://poetech.us/properties/');
  });

  it('reads the unit from ?listing=, or from the preview page\'s own path when the shell booted on it', () => {
    expect(readListingTarget(`?properties=1&listing=${ID.toUpperCase()}`, '/properties/app/')).toBe(ID);
    expect(readListingTarget('', `/properties/l/${ID}/`)).toBe(ID);
    expect(readListingTarget('', `/properties/l/${ID}`)).toBe(ID);
    expect(readListingTarget('?listing=not-an-id', '/properties/l/not-an-id/')).toBeNull();
    expect(readListingTarget('?apply=' + ID, '/properties/app/')).toBeNull();
  });

  it('the words that travel: the name, where, the rent, then the link', () => {
    const t = listingShareText({ rentalId: ID, label: '805 North Prospect Avenue Apt 2', unit: 'Apt 2', where: 'Champaign, Illinois', rent: 800 });
    expect(t).toBe(`805 North Prospect Avenue Apt 2 — Champaign, Illinois — $800/mo\nhttps://poetech.us/properties/l/${ID}/`);
  });
});

describe('the preview page', () => {
  it('carries the unit\'s name, its description with the true month, its picture, and refreshes into the door with its pictures open', () => {
    const html = renderListingPage(UNIT, { image: `https://poetech.us/properties/l/${ID}/photo.jpg`, imageAlt: 'The kitchen' });
    expect(html).toContain('<meta property="og:title" content="805 North Prospect Avenue Apt 2" />');
    expect(html).toContain(`<meta property="og:image" content="https://poetech.us/properties/l/${ID}/photo.jpg" />`);
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(html).toContain(`content="0; url=/properties/app/?properties=1&amp;listing=${ID}"`);
    expect(describeListing(UNIT)).toBe('Champaign, Illinois · $800/mo · Monthly $800 · Weekly $200 ($867 a month on average, $1,000 in a five-week month) · Nightly $150 ($4,563 a month on average, $4,650 in a 31-night month) · The building: Laundry in the entry');
    expect(html).not.toMatch(/<script/);
  });

  it('a unit without a picture gets the icon and a summary card, never a broken image', () => {
    const html = renderListingPage(UNIT);
    expect(html).toContain(`content="${FALLBACK_IMAGE}"`);
    expect(html).toContain('<meta name="twitter:card" content="summary" />');
  });

  it('escapes what the family typed', () => {
    const html = renderListingPage({ ...UNIT, label: 'Apt <2> & "Co"', unit: '' });
    expect(html).toContain('Apt &lt;2&gt; &amp; &quot;Co&quot;');
    expect(listingName({ label: '805 North Prospect Avenue Apt 2', unit: 'Apt 2' })).toBe('805 North Prospect Avenue Apt 2');
    expect(listingName({ label: '805 North Prospect Avenue', unit: 'Apt 2' })).toBe('805 North Prospect Avenue · Apt 2');
  });

  it('a bed says the bedroom is shared, two to a room', () => {
    expect(describeListing({ ...UNIT, rent: 500, weekly_rate: null, nightly_rate: null, offering: 'long-term', shared_home: true, rentable_level: 'bed', building_note: '' }))
      .toBe('Champaign, Illinois · $500/mo · A bed in a shared bedroom, two to a room, in a shared home');
  });

  it('decodes a picture row to bytes, and refuses anything that is not an image data URL', () => {
    const d = decodeDataUrl(JPEG);
    expect(d.ext).toBe('jpg');
    expect(d.bytes[0]).toBe(0xff);
    expect(decodeDataUrl('https://example.com/x.jpg')).toBeNull();
    expect(decodeDataUrl('data:text/html;base64,PGI+')).toBeNull();
  });
});

describe('writing the pages from the shelf', () => {
  const fakeFetch = (units, photos, { photosStatus = 200 } = {}) => async (url, init) => {
    const name = String(url).split('/rpc/')[1];
    if (name === 'public_vacancies') return { ok: true, status: 200, json: async () => units };
    if (name === 'public_vacancy_photos') {
      const body = JSON.parse(init.body || '{}');
      return { ok: photosStatus === 200, status: photosStatus, json: async () => photos[body.p_rental] || [] };
    }
    return { ok: false, status: 404, json: async () => null };
  };

  it('writes one page per listed unit, its own picture beside it, and counts honestly', async () => {
    const dist = mkdtempSync(join(tmpdir(), 'listing-pages-'));
    try {
      const r = await writeListingPages({ dist, base: 'http://x/sb', key: 'k', fetchImpl: fakeFetch([UNIT], { [ID]: [{ storage_path: JPEG, caption: 'The kitchen' }] }), log: () => {} });
      expect(r).toMatchObject({ listed: 1, written: 1, withPicture: 1, failed: [] });
      const page = join(dist, 'properties', 'l', ID, 'index.html');
      expect(existsSync(page)).toBe(true);
      expect(readFileSync(page, 'utf8')).toContain(`/properties/l/${ID}/photo.jpg`);
      expect(statSync(join(dist, 'properties', 'l', ID, 'photo.jpg')).size).toBeGreaterThan(100);
    } finally { rmSync(dist, { recursive: true, force: true }); }
  });

  it('PROVEN-TO-CATCH: a picture read that fails is a failure in the count, and the page still stands with the icon', async () => {
    const dist = mkdtempSync(join(tmpdir(), 'listing-pages-'));
    try {
      const r = await writeListingPages({ dist, base: 'http://x/sb', key: 'k', fetchImpl: fakeFetch([UNIT], {}, { photosStatus: 401 }), log: () => {} });
      expect(r.written).toBe(1);
      expect(r.withPicture).toBe(0);
      expect(r.failed.join(' ')).toMatch(/public_vacancy_photos: .*401/);
      expect(readFileSync(join(dist, 'properties', 'l', ID, 'index.html'), 'utf8')).toContain(FALLBACK_IMAGE);
    } finally { rmSync(dist, { recursive: true, force: true }); }
  });

  it('a shelf that cannot be read writes nothing and says so — never an empty set of pages presented as the truth', async () => {
    const dist = mkdtempSync(join(tmpdir(), 'listing-pages-'));
    try {
      const r = await writeListingPages({ dist, base: 'http://x/sb', key: 'k', fetchImpl: async () => ({ ok: false, status: 503, json: async () => null }), log: () => {} });
      expect(r).toMatchObject({ listed: 0, written: 0 });
      expect(r.failed[0]).toMatch(/public_vacancies: .*503/);
    } finally { rmSync(dist, { recursive: true, force: true }); }
  });
});
