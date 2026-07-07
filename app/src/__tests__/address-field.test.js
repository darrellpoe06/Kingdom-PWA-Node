// @vitest-environment node
// AddressField pure helpers — pinned: a Nominatim pick maps to clean location
// data, and the map link only exists for real coordinates (DR-0076).
import { describe, it, expect } from 'vitest';
import { pickToLocation, osmLink } from '../components/AddressField.jsx';

describe('pickToLocation', () => {
  it('builds "street, town, state" + numeric coords from a Nominatim result', () => {
    const loc = pickToLocation({
      display_name: '1234 5th Ave, Moline, Rock Island County, Illinois, USA',
      lat: '41.5067', lon: '-90.5151',
      address: { house_number: '1234', road: '5th Ave', city: 'Moline', state: 'Illinois' },
    });
    expect(loc.label).toBe('1234 5th Ave, Moline, Illinois');
    expect(loc.lat).toBeCloseTo(41.5067);
    expect(loc.lon).toBeCloseTo(-90.5151);
  });
  it('falls back to the display name head when address parts are missing', () => {
    const loc = pickToLocation({ display_name: 'Moline Public Library, Illinois', lat: '41.5', lon: '-90.5', address: {} });
    expect(loc.label).toContain('Moline Public Library');
  });
  it('a town without a city key still resolves (village/hamlet)', () => {
    const loc = pickToLocation({ display_name: 'x', lat: '1', lon: '2', address: { road: 'Main St', village: 'Andalusia', state: 'Illinois' } });
    expect(loc.label).toBe('Main St, Andalusia, Illinois');
  });
});

describe('osmLink — a map link only for real coordinates', () => {
  it('links a real pick', () => {
    expect(osmLink(41.5, -90.5)).toContain('openstreetmap.org/?mlat=41.5&mlon=-90.5');
  });
  it('never fabricates a link without coords', () => {
    expect(osmLink(null, null)).toBeNull();
    expect(osmLink(undefined, undefined)).toBeNull();
    expect(osmLink(NaN, NaN)).toBeNull();
  });
});
