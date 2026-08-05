// =============================================================================
// Relationships MATRIX — phone-width layout (Darrell 2026-08-05 screenshot:
// "Allowed" badges escaped their role column and overlapped the neighbor's
// text; one clipped off the screen edge). The defect shape: an inline
// gridTemplateColumns forced N role columns at EVERY width, and the capability
// rows were no-wrap flex — so with content-scaled text (Pattern 2b) a badge
// could neither fit nor wrap. The contract pinned here:
//   · role columns stack on phones (grid-cols-1) and go side-by-side only at
//     breakpoints (sm:/lg:) — never a forced inline repeat(N, …) template;
//   · every capability row wraps (flex-wrap), and badges are shrink-0, so an
//     over-wide badge drops below its label instead of overflowing the column.
// Mounts the real component (governor view) in jsdom. Device-local, no network.
// =============================================================================
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import Relationships from '../components/Relationships.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeAll(async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(Relationships, { isGovernor: true })); });
  await act(async () => { await Promise.resolve(); });
});
afterEach(() => { /* single mount shared across pins */ });

describe('the matrix at phone width (DR-0131 sibling: content must fit, not fly or collide)', () => {
  it('role columns stack by default and widen only at breakpoints — no forced inline column template', () => {
    const grids = [...container.querySelectorAll('div.grid.grid-cols-1')];
    expect(grids.length).toBeGreaterThan(0);
    const roleGrid = grids.find((g) => /sm:grid-cols-2/.test(g.className));
    expect(roleGrid).toBeTruthy();
    // the defect shape is gone: nothing forces repeat(N, …) at all widths
    for (const el of container.querySelectorAll('[style]')) {
      expect(el.style.gridTemplateColumns || '').not.toMatch(/repeat\(/);
    }
  });

  it('capability rows wrap and badges refuse to squeeze (shrink-0), so nothing overflows the column', () => {
    const rows = [...container.querySelectorAll('li.flex.flex-wrap')];
    expect(rows.length).toBeGreaterThan(0);
    const badges = [...container.querySelectorAll('span.shrink-0')];
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.some((b) => /Allowed|Ask first|Locked|Never/.test(b.textContent))).toBe(true);
  });
});
