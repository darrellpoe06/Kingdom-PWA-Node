// =============================================================================
// ReactionKey — live render proof that the Help legend reads from the ONE source
// (Verification Doctrine DR-0076 + declutter/DR-0079: one canonical registry).
// =============================================================================
// Darrell 2026-07-02: the Help "key" must teach every reaction symbol's meaning +
// Scripture, sourced from the SAME registry the picker's hover reads (reactions.js)
// — never a second, drift-prone copy. This test mounts the real ReactionKey and
// proves that EVERY reaction in the registry (and each Godhead reaction's verse
// reference) actually renders. Add a reaction to lib/reactions.js and forget the
// key? Impossible — the key renders from the registry, and this gate proves it.
// It also proves the Help entry that surfaces the key is marked as the legend.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ReactionKey from '../components/ReactionKey.jsx';
import { REACTIONS } from '../lib/reactions.js';
import { HELP } from '../lib/help-content.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
afterEach(() => {
  try { act(() => root && root.unmount()); } catch { /* noop */ }
  if (container) container.remove();
  container = null; root = null;
});

async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(el); });
  return container.textContent || '';
}

describe('ReactionKey renders the whole registry from the single source', () => {
  it('shows every reaction label and every Godhead Scripture reference', async () => {
    const text = await mount(createElement(ReactionKey));
    // Every reaction in the registry must appear by name (nothing dropped).
    for (const r of REACTIONS) {
      expect(text.includes(r.label), `key is missing "${r.label}"`).toBe(true);
    }
    // Every Scripture-anchored reaction must show its reference + the KJV badge,
    // so the key TEACHES the anchor, not just the symbol.
    const anchored = REACTIONS.filter((r) => r.scripture);
    expect(anchored.length).toBeGreaterThan(20);
    for (const r of anchored) {
      expect(text.includes(r.scripture.ref), `key is missing verse ${r.scripture.ref}`).toBe(true);
    }
    expect(text).toContain('(KJV)');
  });

  it('can hide the plain set to show only the Godhead images', async () => {
    const text = await mount(createElement(ReactionKey, { plain: false }));
    expect(text).toContain('Lion of Judah');   // a Son image stays
    expect(text).not.toContain('Wrestling');    // the plain 'thumbs-down' label is gone
  });
});

describe('the Help space surfaces the key from that same source (no duplicate copy)', () => {
  it('has a reactions help entry flagged to render the legend component', () => {
    expect(HELP.reactions, 'missing HELP.reactions entry').toBeTruthy();
    expect(HELP.reactions.legend).toBe('reactions');
    // The entry itself carries NO per-symbol meanings/verses — those live only in
    // the registry the legend renders. Guard against a second copy sneaking in.
    const blob = [HELP.reactions.what, HELP.reactions.why, HELP.reactions.more || '',
      ...HELP.reactions.how].join(' ');
    expect(blob).not.toContain('(KJV)');
  });
});
