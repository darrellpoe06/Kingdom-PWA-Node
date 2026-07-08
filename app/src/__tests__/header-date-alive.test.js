// @vitest-environment node
//
// The header date is the "system is alive RIGHT NOW" signal (D20b, 2026-06-03)
// — and on 2026-07-08 it recurred in a new face: the date memo computed ONCE at
// mount (`useMemo(..., [])`), so an installed PWA resumed the next day showed
// yesterday's date beside a live-ticking time (Darrell: "date is stale, how
// when we have LLMs"). Source-pinned so the freeze cannot come back: the date
// label must derive from the same ticking clock state as the time label.
// Authored RED against the pre-fix code (format(new Date()) with [] deps).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');

function blockOf(name) {
  const start = src.indexOf(`const ${name} = useMemo(`);
  expect(start, `${name} memo exists`).toBeGreaterThan(-1);
  const end = src.indexOf(');', src.indexOf('}, [', start));
  return src.slice(start, end + 2);
}

describe('header date stays alive (D20b recurrence, 2026-07-08)', () => {
  it('headerDateLabel formats the ticking clock, never a mount-time Date', () => {
    const block = blockOf('headerDateLabel');
    expect(block).toContain('format(headerClockNow)');
    expect(block).not.toContain('format(new Date())');
  });
  it('headerDateLabel recomputes when the clock ticks (deps carry headerClockNow)', () => {
    const block = blockOf('headerDateLabel');
    expect(block).toMatch(/\}, \[headerClockNow\]\)/);
  });
  it('the clock actually ticks (interval updates headerClockNow) and cleans up', () => {
    expect(src).toContain('setInterval(() => setHeaderClockNow(new Date())');
    expect(src).toMatch(/clearInterval\(id\)/);
  });
  it('the header renders the derived labels (the surface uses what the clock feeds)', () => {
    expect(src).toContain('{headerDateLabel}');
    expect(src).toContain('{headerTimeLabel');
  });
});
