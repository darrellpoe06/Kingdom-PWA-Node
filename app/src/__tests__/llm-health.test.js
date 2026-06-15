// The live feed needs the NAS (Ollama /api/ps via wf-llm-health), but its
// PARSING is pure and verified here so the card's data handling never ships
// untested (DR-0061 / P16 / Verification Doctrine DR-0076).
//
// The "real feed" fixture below is the ACTUAL envelope produced by running the
// wf-llm-health Code-node transform against the live box (192.168.1.26:11434,
// Ollama 0.24.0) on 2026-06-15 — idle, 4 models installed, none pinned.
import { describe, it, expect } from 'vitest';
import { normalizeLlmHealth, formatGB } from '../components/LlmHealth.jsx';

describe('normalizeLlmHealth', () => {
  it('returns ok:false (not a throw) for null / garbage / unreachable', () => {
    expect(normalizeLlmHealth(null).ok).toBe(false);
    expect(normalizeLlmHealth('nope').ok).toBe(false);
    const n = normalizeLlmHealth({ ok: false, error: 'ollama unreachable' });
    expect(n.ok).toBe(false);
    expect(n.error).toMatch(/unreachable/i);
    expect(n.loaded).toEqual([]);
    expect(n.installed).toEqual([]);
  });

  it('normalizes the real idle envelope from the live box', () => {
    const n = normalizeLlmHealth({
      ok: true,
      version: '0.24.0',
      loaded: [],
      installed: [
        { name: 'deepseek-r1:8b', size: 5225376047 },
        { name: 'qwen2.5:14b-instruct-q4_K_M', size: 8988124069 },
      ],
      loaded_count: 0,
      installed_count: 4,
      any_pinned: false,
    });
    expect(n.ok).toBe(true);
    expect(n.version).toBe('0.24.0');
    expect(n.loadedCount).toBe(0);
    expect(n.installedCount).toBe(4); // honored from the feed, not the array length
    expect(n.anyPinned).toBe(false);
    expect(n.installed[0].name).toBe('deepseek-r1:8b'); // sorted
  });

  it('surfaces a pinned model (the runaway signature) and derives any_pinned', () => {
    const n = normalizeLlmHealth({
      ok: true,
      loaded: [
        { name: 'qwen2.5:14b', size_vram: 9000000000, expires_at: '2999-01-01T00:00:00Z', pinned: true },
        { name: 'deepseek-r1:8b', size_vram: 5000000000, expires_at: '2026-06-15T20:00:00Z', pinned: false },
      ],
      installed: [],
    });
    expect(n.loaded).toHaveLength(2);
    expect(n.loaded[0].pinned).toBe(true);
    expect(n.loaded[0].sizeVram).toBe(9000000000);
    expect(n.anyPinned).toBe(true); // derived from the pinned member even if feed omits it
    expect(n.loadedCount).toBe(2); // derived from array length when count absent
  });
});

describe('formatGB', () => {
  it('formats bytes to GB and rejects garbage', () => {
    expect(formatGB(8988124069)).toBe('9.0 GB');
    expect(formatGB(274302450)).toBe('0.3 GB');
    expect(formatGB(0)).toBe(null);
    expect(formatGB(null)).toBe(null);
    expect(formatGB('nope')).toBe(null);
  });
});
