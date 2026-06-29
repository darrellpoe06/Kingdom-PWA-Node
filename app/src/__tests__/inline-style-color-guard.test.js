// @vitest-environment node
//
// Inline-style color guard (DR-0076). The 2026-06-25 Chef's Corner bug: every
// recipe text color was set via inline `style={{ color: '#1A1815' }}` (through
// local hex consts), which WINS over the per-theme remap — so the dark theme
// rendered black-on-black, unreadable. The per-theme contrast gate verifies the
// theme TOKEN CLASSES but is blind to inline hex. This gate closes that blind
// spot and runs inside the required `app — lint + vitest` so a clean surface
// can't regress to inline color. Logic in scripts/inline-style-color-guard.mjs.
import { describe, it, expect } from 'vitest';
import { scanSource, checkCleanFiles } from '../../../scripts/inline-style-color-guard.mjs';

describe('inline-style color guard — clean files stay token-only', () => {
  it('every clean-gated file routes all color through shared theme classes', () => {
    const v = checkCleanFiles();
    const msg = v.map((x) => `${x.file}:${x.line} ${x.prop}: ${x.value}`).join('; ');
    expect(v, msg).toEqual([]);
  });
});

describe('inline-style color guard — proven to catch (anti-theater)', () => {
  it('CATCHES an inline hex color (the Chef\'s Corner bug class)', () => {
    expect(scanSource(`<div style={{ color: '#1A1815' }}>x</div>`).length).toBeGreaterThan(0);
  });

  it('CATCHES an inline color CONST (the INK/MUTE pattern)', () => {
    expect(scanSource(`<div style={{ color: INK }}>x</div>`).some((h) => h.value === 'INK')).toBe(true);
  });

  it('CATCHES inline backgroundColor + borderColor hex', () => {
    const hits = scanSource(`<div style={{ backgroundColor: '#FAF8F4', borderColor: '#E8E4DC' }}>x</div>`);
    expect(hits.map((h) => h.prop).sort()).toEqual(['backgroundColor', 'borderColor']);
  });

  it('PASSES theme-class color with no inline style (the fix)', () => {
    expect(scanSource(`<div className="text-[#1A1815] bg-white border-[#E8E4DC]">x</div>`)).toEqual([]);
  });

  it('PASSES theme-safe inline keywords (transparent / currentColor / inherit)', () => {
    expect(scanSource(`<div style={{ color: 'transparent', backgroundColor: 'currentColor' }}>x</div>`)).toEqual([]);
  });

  it('IGNORES an example written inside a comment', () => {
    const c = `// e.g. style={{ color: '#1A1815' }}\n<div className="text-[#1A1815]">x</div>`;
    expect(scanSource(c)).toEqual([]);
  });

  it('does NOT flag non-color inline style (width, fontFamily)', () => {
    expect(scanSource(`<div style={{ width: '50%', fontFamily: 'serif' }}>x</div>`)).toEqual([]);
  });
});
