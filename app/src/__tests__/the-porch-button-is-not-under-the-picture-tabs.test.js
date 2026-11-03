// =============================================================================
// The porch button is not under the picture tabs (DR-1304)
// =============================================================================
// Darrell, 2026-11-03, with a screenshot of the Poe Properties front door:
// "The button to open the porch camera is too close to the picture tab...
// user's can't open the camera it's too close!!!!!!!!!! Fix it!!!!!!!!!"
//
// What was measured in a real Chromium before the fix (390x844 and 1440x900):
// the button's box ran from 36px to 0px above the frame's bottom edge; the
// carousel's picture tabs (.pp-segments) run the whole width of the frame,
// 44px tall, anchored at the bottom, at z-index 3 over the button's 2. Five
// of five sample points on the button, and a real click at its centre, were
// received by a picture tab. The button could not be pressed at all.
//
// jsdom cannot measure geometry, so this file guards the CSS facts that made
// the collision: the button is anchored to the TOP of the frame (the tabs own
// the bottom edge, full width), and it stacks ABOVE the tabs. Either fact
// returning to its old value is the bug coming back.
import { describe, it, expect } from 'vitest';
import { WELCOME_CSS } from '../components/PoePropertiesWelcome.jsx';

/** The declarations of one selector's first block in a CSS string. */
function rule(css, selector) {
  const i = css.indexOf(`${selector}{`);
  if (i < 0) return null;
  const body = css.slice(i + selector.length + 1, css.indexOf('}', i));
  return Object.fromEntries(body.split(';').filter(Boolean).map((d) => { const k = d.indexOf(':'); return [d.slice(0, k).trim(), d.slice(k + 1).trim()]; }));
}

/** Does the porch button share the picture tabs' edge, or sit under them? */
function collides(css) {
  const btn = rule(css, '.pp-cam-open');
  const tabs = rule(css, '.pp-segments');
  if (!btn || !tabs) return 'rule missing';
  const sameEdge = 'bottom' in btn && 'bottom' in tabs;
  const under = Number(btn['z-index'] || 0) <= Number(tabs['z-index'] || 0);
  return sameEdge ? 'same edge' : under ? 'stacked under' : '';
}

describe('the porch button is not under the picture tabs (DR-1304)', () => {
  it('the picture tabs own the bottom edge of the frame, full width, 44px tall', () => {
    const tabs = rule(WELCOME_CSS, '.pp-segments');
    expect(tabs).toMatchObject({ position: 'absolute', left: '0', right: '0', bottom: '0' });
    expect(rule(WELCOME_CSS, '.pp-seg')['min-height']).toBe('44px');
  });

  it('so the porch button is anchored to the TOP of the frame, and stacks above the tabs', () => {
    const btn = rule(WELCOME_CSS, '.pp-cam-open');
    expect(btn.position).toBe('absolute');
    expect(btn.top).toBe('calc(0.6 * var(--ts-fixed,1rem))');
    expect(btn.bottom).toBeUndefined();
    expect(Number(btn['z-index'])).toBeGreaterThan(Number(rule(WELCOME_CSS, '.pp-segments')['z-index']));
    expect(collides(WELCOME_CSS)).toBe('');
  });

  it('PROVEN-TO-CATCH: the rule as it shipped before (bottom-left, z-index 2) is the collision', () => {
    const before = WELCOME_CSS.replace(
      '.pp-cam-open{position:absolute;top:calc(0.6 * var(--ts-fixed,1rem));left:calc(0.6 * var(--ts-fixed,1rem));z-index:4;',
      '.pp-cam-open{position:absolute;bottom:calc(0.6 * var(--ts-fixed,1rem));left:calc(0.6 * var(--ts-fixed,1rem));z-index:2;',
    );
    expect(before).not.toBe(WELCOME_CSS);
    expect(collides(before)).toBe('same edge');
    // And a top-anchored button that merely stacks under the tabs is caught too.
    const under = WELCOME_CSS.replace('left:calc(0.6 * var(--ts-fixed,1rem));z-index:4;', 'left:calc(0.6 * var(--ts-fixed,1rem));z-index:3;');
    expect(under).not.toBe(WELCOME_CSS);
    expect(collides(under)).toBe('stacked under');
  });
});
