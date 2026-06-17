// Render smoke test for the shared gallery Lightbox. Proves the component
// actually mounts and emits the gallery chrome (counter, prev/next, close, zoom,
// caption) for the right photo at the right index — and that the single-`src`
// back-compat shape and the empty/guard shapes still behave. renderToStaticMarkup
// (the repo's established render-test tool) verifies STRUCTURE deterministically;
// the pointer/keyboard interaction is standard event handling layered on this
// verified structure. DR-0076 — measure, don't claim.
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Lightbox from '../components/Lightbox.jsx';

const items = [
  { src: 'data:image/jpeg;base64,ONE', alt: 'one', caption: 'First room', date: '2024-01-01' },
  { src: 'data:image/jpeg;base64,TWO', alt: 'two', caption: 'Second room', date: '2024-06-01' },
  { src: 'data:image/jpeg;base64,THREE', alt: 'three', caption: 'Third room', date: '2024-12-01' },
];

const render = (props) => renderToStaticMarkup(createElement(Lightbox, { onClose: () => {}, ...props }));

describe('Lightbox — gallery render', () => {
  it('gallery mode shows the counter, both nav arrows, close, zoom, and the indexed photo', () => {
    const html = render({ items, index: 1 });
    expect(html).toContain('2 / 3');                 // counter at the right index
    expect(html).toContain('aria-label="Previous photo"');
    expect(html).toContain('aria-label="Next photo"');
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('100%');                  // zoom readout starts at 100%
    expect(html).toContain('base64,TWO');            // the photo for index 1
    expect(html).toContain('Second room');           // its caption
    expect(html).toContain('2024-06-01');            // its date
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it('clamps nav arrows at the ends — first photo hides Previous', () => {
    const html = render({ items, index: 0 });
    expect(html).toContain('1 / 3');
    expect(html).not.toContain('aria-label="Previous photo"'); // no prev at the start
    expect(html).toContain('aria-label="Next photo"');
    expect(html).toContain('base64,ONE');
  });

  it('clamps nav arrows at the ends — last photo hides Next', () => {
    const html = render({ items, index: 2 });
    expect(html).toContain('3 / 3');
    expect(html).toContain('aria-label="Previous photo"');
    expect(html).not.toContain('aria-label="Next photo"'); // no next at the end
    expect(html).toContain('base64,THREE');
  });

  it('clamps an out-of-range index into the set (never blank)', () => {
    const html = render({ items, index: 99 });
    expect(html).toContain('3 / 3');
    expect(html).toContain('base64,THREE');
  });

  it('single-src back-compat: renders the photo, no gallery counter/arrows', () => {
    const html = render({ src: 'data:image/jpeg;base64,SOLO', alt: 'solo' });
    expect(html).toContain('base64,SOLO');
    expect(html).toContain('aria-label="Close"');
    expect(html).not.toContain(' / ');                 // no "n / m" counter for a single photo
    expect(html).not.toContain('aria-label="Next photo"');
  });

  it('renders nothing when there is no photo (empty items, no src)', () => {
    expect(render({ items: [] })).toBe('');
    expect(render({})).toBe('');
  });
});
