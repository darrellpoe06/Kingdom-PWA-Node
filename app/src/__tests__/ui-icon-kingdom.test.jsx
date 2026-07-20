// @vitest-environment jsdom
//
// UiIcon — the Kingdom glyphs (DR-0198). The icon palette must carry Kingdom
// iconography as reliable SVG (renders on every device, never tofu). Prove the
// new names exist and render real <svg> geometry, and that a decorative-only
// name (unknown) renders nothing rather than a broken box.
import { describe, it, expect } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import UiIcon, { UI_ICON_NAMES } from '../components/UiIcon.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function render(name) {
  const el = document.createElement('div');
  await act(async () => { createRoot(el).render(createElement(UiIcon, { name })); });
  return el;
}

describe('UiIcon — Kingdom glyphs', () => {
  it('the Kingdom names are registered in the palette', () => {
    for (const n of ['cross', 'flame', 'crown', 'dove', 'bookOpen']) {
      expect(UI_ICON_NAMES).toContain(n);
    }
  });

  it('each Kingdom glyph renders a real <svg> with path geometry (not tofu)', async () => {
    for (const n of ['cross', 'flame', 'crown']) {
      const el = await render(n);
      const svg = el.querySelector('svg');
      expect(svg, `${n} renders an svg`).toBeTruthy();
      expect(svg.querySelectorAll('path').length, `${n} has path geometry`).toBeGreaterThan(0);
    }
  });

  it('an unknown icon name renders nothing (no broken box)', async () => {
    const el = await render('definitely-not-an-icon');
    expect(el.querySelector('svg')).toBeNull();
  });
});
