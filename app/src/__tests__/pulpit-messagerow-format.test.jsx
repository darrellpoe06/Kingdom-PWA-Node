// =============================================================================
// MessageRow — one FIXED data format for every video (Darrell 2026-07-14:
// "keep the same data format for each video so we train the eyes for where to
// look"). The bug: the row floated the date top-right with justify-between, so a
// long (wrapping) title pushed the date to a different line than a short title
// did — the eye couldn't learn one spot. The fix: a single metadata line, always
// directly under the title, in a fixed order (date · kind · speaker · scripture).
// Proven-to-catch: the SAME metadata string renders in the SAME structural spot
// whether the title is short or long.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MessageRow } from '../components/Pulpit.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const base = {
  id: 's1', serviceDate: '2026-07-05', serviceType: 'sunday',
  speaker: 'Bishop Lloyd E. Gwin', scriptureRef: 'Isaiah 61:7',
  youtubeUrl: 'https://youtu.be/abc12345678', status: 'active',
};
const mount = (sermon) => act(() => root.render(createElement(MessageRow, { sermon, canEdit: false })));

// The one metadata paragraph: the <p> that carries the date. It must also carry
// kind + speaker + scripture — one line, one place.
const metaLine = () =>
  [...container.querySelectorAll('p')].find((p) => /Jul 5, 2026/.test(p.textContent || ''));

describe('MessageRow — one fixed data format per video', () => {
  it('renders date · kind · speaker · scripture together in ONE metadata line', () => {
    mount({ ...base, title: 'Celebrate!' });
    const p = metaLine();
    expect(p, 'no metadata line carrying the date').toBeTruthy();
    const t = p.textContent.replace(/\s+/g, ' ');
    expect(t).toMatch(/Sun, Jul 5, 2026/);   // date (weekday from the real date)
    expect(t).toMatch(/· Service/);          // kind tag (weekday lives in the date)
    expect(t).toMatch(/Bishop Lloyd E\. Gwin/); // speaker
    expect(t).toMatch(/Isaiah 61:7/);        // scripture
  });

  it('keeps the date OFF the title line (never floated beside the title)', () => {
    mount({ ...base, title: 'Celebrate!' });
    const titleSpan = [...container.querySelectorAll('span')].find((s) => s.textContent === 'Celebrate!');
    expect(titleSpan).toBeTruthy();
    // The title's own row must not contain the date — that float was the bug.
    expect(titleSpan.parentElement.textContent).not.toMatch(/Jul 5, 2026/);
  });

  it('puts the metadata in the SAME spot for a long title as for a short one', () => {
    // Short title
    mount({ ...base, title: 'Celebrate!' });
    const shortMetaParentTag = metaLine().parentElement.tagName;
    const shortPrevIsTitleRow = /Celebrate!/.test(metaLine().previousElementSibling?.textContent || '');
    act(() => root.unmount());
    // Long, wrapping title — the case that used to move the date to another line.
    root = createRoot(container);
    mount({ ...base, title: '7 - 8 - 26 Pastor Ken McCray "Do Not Let Your Struggle Distract You From Your Double!"' });
    const longMetaParentTag = metaLine().parentElement.tagName;
    const longPrevIsTitleRow = /Pastor Ken McCray/.test(metaLine().previousElementSibling?.textContent || '');
    // Same structural home: metadata is the sibling right after the title row in both.
    expect(shortMetaParentTag).toBe(longMetaParentTag);
    expect(shortPrevIsTitleRow).toBe(true);
    expect(longPrevIsTitleRow).toBe(true);
  });
});

// A video placeholder so the flow stays the same and lost videos are findable
// (Darrell 2026-07-14). A message with no video (e.g. from BG's emailed outline)
// keeps the same card shape — a same-size placeholder in the thumbnail slot,
// labelled so the missing video is visible — instead of collapsing the layout.
describe('MessageRow — video placeholder for messages with no video', () => {
  const mountWith = (props) => act(() => root.render(createElement(MessageRow, props)));
  const noVideo = { id: 'nv', serviceDate: '2026-03-08', serviceType: 'sunday', title: 'Only Move When He Moves', youtubeUrl: null, status: 'active' };

  it('shows a "No video" placeholder (not a collapsed card) when there is no video', () => {
    mountWith({ sermon: noVideo, canEdit: false });
    expect(container.querySelector('img'), 'should have no real thumbnail image').toBeFalsy();
    const ph = container.querySelector('[aria-label="No video attached yet"]');
    expect(ph, 'no video placeholder rendered').toBeTruthy();
    expect(ph.textContent).toMatch(/no video/i);
    // Same slot shape as a real thumbnail (aspect-video, fixed width).
    expect(ph.className).toMatch(/aspect-video/);
    expect(ph.className).toMatch(/w-28/);
  });

  it('leadership placeholder is a one-tap way into Edit to attach the found video', () => {
    const onEdit = vi.fn();
    mountWith({ sermon: noVideo, canEdit: true, onEdit });
    const ph = [...container.querySelectorAll('button')].find((b) => /no video/i.test(b.textContent || ''));
    expect(ph).toBeTruthy();
    act(() => ph.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders the REAL thumbnail (no placeholder) when a video exists', () => {
    mountWith({ sermon: { ...noVideo, youtubeUrl: 'https://youtu.be/abc12345678' }, canEdit: false });
    expect(container.querySelector('img')).toBeTruthy();
    const ph = [...container.querySelectorAll('div,button')].find((el) => /no video/i.test(el.textContent || ''));
    expect(ph).toBeFalsy();
  });
});
