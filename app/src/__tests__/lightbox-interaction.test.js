// Interaction test for the gallery Lightbox — mounts it in jsdom and fires REAL
// events to prove the behaviors the live preview was meant to confirm:
// it OPENS at the asked index, NAVIGATES (next/prev + arrow keys), CLOSES
// (✕ button + Escape), and the zoom controls change scale. Deterministic and
// permanent — DR-0076 (independent verification), proven by driving the UI, not
// by reading the code.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import Lightbox from '../components/Lightbox.jsx';

// Tell React this is an act() environment so batched updates flush cleanly.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
const items = [
  { src: 'data:image/jpeg;base64,ONE', alt: 'one', caption: 'First' },
  { src: 'data:image/jpeg;base64,TWO', alt: 'two', caption: 'Second' },
  { src: 'data:image/jpeg;base64,THREE', alt: 'three', caption: 'Third' },
];

beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

const mount = (props) => act(() => { root.render(createElement(Lightbox, { items, onClose: () => {}, ...props })); });
const q = (sel) => container.querySelector(sel);
const counter = () => [...container.querySelectorAll('*')].map((e) => e.textContent).find((t) => /^\d+ \/ \d+$/.test((t || '').trim()));
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const key = (k) => act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: k })));

describe('Lightbox — interaction', () => {
  it('OPENS at the requested index', () => {
    mount({ index: 1 });
    expect(counter()).toBe('2 / 3');
    expect(q('img').src).toContain('base64,TWO');
  });

  it('NAVIGATES forward with the Next button', () => {
    mount({ index: 0 });
    expect(counter()).toBe('1 / 3');
    click(q('[aria-label="Next photo"]'));
    expect(counter()).toBe('2 / 3');
    expect(q('img').src).toContain('base64,TWO');
  });

  it('NAVIGATES with arrow keys, clamped at the ends', () => {
    mount({ index: 0 });
    key('ArrowRight'); expect(counter()).toBe('2 / 3');
    key('ArrowRight'); expect(counter()).toBe('3 / 3');
    key('ArrowRight'); expect(counter()).toBe('3 / 3'); // clamped, no wrap past the end
    key('ArrowLeft');  expect(counter()).toBe('2 / 3');
  });

  it('CLOSES on the ✕ button', () => {
    const onClose = vi.fn();
    mount({ index: 0, onClose });
    click(q('[aria-label="Close"]'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('CLOSES on Escape', () => {
    const onClose = vi.fn();
    mount({ index: 0, onClose });
    key('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ZOOMS in/out with the controls', () => {
    mount({ index: 0 });
    const pct = () => [...container.querySelectorAll('span')].map((e) => e.textContent).find((t) => /%$/.test(t || ''));
    expect(pct()).toBe('100%');
    click(q('[aria-label="Zoom in"]'));
    expect(pct()).toBe('150%');
    click(q('[aria-label="Zoom out"]'));
    expect(pct()).toBe('100%');
  });
});
