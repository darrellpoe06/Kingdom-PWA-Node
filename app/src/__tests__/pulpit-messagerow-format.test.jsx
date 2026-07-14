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
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
