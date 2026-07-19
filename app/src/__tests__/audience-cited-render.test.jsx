// AudienceSlide resolves the Scriptures a slide CITES to VERBATIM KJV and shows them
// so the room reads the Word directly (Darrell 2026-07-19). The corpus fetch is
// injected (a fake Jude book), so this proves the real resolve->render path without
// the network — and that an UNRESOLVABLE ref is silently dropped (never invented).
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import AudienceSlide from '../components/AudienceSlide.jsx';
import { __setBibleFetcher } from '../lib/bible-kjv.js';

// Jude is a single-chapter book; verse 3 is the "contend for the faith" verse.
const JUDE = { name: 'Jude', chapters: [['v1', 'v2', 'Beloved, contend for the faith once delivered.', 'v4']] };
const fakeFetch = (url) => Promise.resolve({
  ok: /Jude\.json$/.test(url),
  json: () => Promise.resolve(/Jude\.json$/.test(url) ? JUDE : {}),
});

afterEach(() => { __setBibleFetcher(null); });

async function mountAndFlush(el) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(el); });
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); }); // let verseText resolve
  return { container, cleanup: () => { act(() => root.unmount()); container.remove(); } };
}

describe('AudienceSlide — cited Scripture shown verbatim', () => {
  it('resolves a cited ref to its verbatim KJV and renders it for the room', async () => {
    __setBibleFetcher(fakeFetch);
    const slide = { title: 'Go deeper', lead: 'The main idea.', citedRefs: ['Jude 3'] };
    const { container, cleanup } = await mountAndFlush(createElement(AudienceSlide, { slide }));
    expect(container.textContent).toMatch(/Jude 3/);
    expect(container.textContent).toMatch(/contend for the faith once delivered/i);
    cleanup();
  });

  it('drops a ref that does not resolve — never invents text', async () => {
    __setBibleFetcher(fakeFetch); // only Jude resolves
    const slide = { title: 'X', lead: 'Idea.', citedRefs: ['Nowhere 9:9'] };
    const { container, cleanup } = await mountAndFlush(createElement(AudienceSlide, { slide }));
    expect(container.textContent).toMatch(/Idea\./);
    expect(container.textContent).not.toMatch(/Nowhere 9:9/); // unresolved -> not shown
    cleanup();
  });

  it('renders the running Scripture rail — count of total, current refs highlighted', async () => {
    __setBibleFetcher(fakeFetch);
    const slide = {
      title: 'Go deeper', lead: 'idea', citedRefs: ['Mark 10:43-45'],
      scripturesSoFar: ['Psalm 1:1', '1 Corinthians 12:18', 'Mark 10:43-45'], scripturesTotal: 8,
    };
    const { container, cleanup } = await mountAndFlush(createElement(AudienceSlide, { slide }));
    // its own side space: a running count of the total, and the trail of references
    expect(container.textContent).toMatch(/Scriptures · 3 of 8/);
    const rail = container.querySelector('aside');
    expect(rail).toBeTruthy();
    expect(rail.textContent).toMatch(/Psalm 1:1/);
    expect(rail.textContent).toMatch(/Mark 10:43-45/);
    cleanup();
  });
});
