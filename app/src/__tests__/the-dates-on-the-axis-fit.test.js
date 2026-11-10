// =============================================================================
// the-dates-on-the-axis-fit — the timeline's dates never print over each other
// =============================================================================
// Darrell 2026-11-10, at Big Print on the Progress of Revelation chart: the
// axis read "14001200 BC1000 BC800 BC 600400 BC" — "Fix the dates...". Six
// labels were drawn whatever the room, and Big Print grows the labels but not
// the axis. The axis is now measured and only as many dates as fit are drawn.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { spanTicks, tickGap } from '../lib/lesson-figures.js';

const OT = { start: 1445, end: 331, at: (y) => (1445 - y) / (1445 - 331) };
// Geometry of the drawn labels: the ends align to the edge, the rest centre.
function overlaps(ticks, width, labelWidth) {
  const boxes = ticks.map((t) => {
    const x = t.at * width;
    const left = t.at < 0.08 ? x : t.at > 0.92 ? x - labelWidth : x - labelWidth / 2;
    return [left, left + labelWidth];
  });
  return boxes.some((b, i) => i > 0 && b[0] < boxes[i - 1][1]);
}

describe('only the dates that fit are drawn', () => {
  it('PROVEN TO CATCH: six dates at Big Print on a phone overlap, as in the screenshot', () => {
    const six = spanTicks(OT, 'BC');
    expect(six.map((t) => t.label)).toEqual(['1400 BC', '1200 BC', '1000 BC', '800 BC', '600 BC', '400 BC']);
    expect(overlaps(six, 330, 7 * 20 * 0.62)).toBe(true);
  });
  it('the fitted count never overlaps, at every text size and width measured', () => {
    for (const width of [300, 360, 420, 600, 900]) {
      for (const font of [9, 12, 16, 20, 28]) {
        const labelWidth = 7 * font * 0.62;
        const ticks = spanTicks(OT, 'BC', tickGap(width, labelWidth));
        expect(ticks.length, `${width}px at ${font}px`).toBeGreaterThanOrEqual(1);
        expect(overlaps(ticks, width, labelWidth), `${width}px at ${font}px`).toBe(false);
      }
    }
  });
  it('with room, the axis keeps its six dates, and an unmeasured axis is unchanged', () => {
    expect(spanTicks(OT, 'BC', tickGap(900, 7 * 9 * 0.62))).toHaveLength(6);
    expect(spanTicks(OT, 'BC')).toHaveLength(6);
    expect(tickGap(0, 50)).toBe(0);
  });
  it('the screenshot’s case draws fewer, wider-spaced dates instead of colliding ones', () => {
    const fitted = spanTicks(OT, 'BC', tickGap(330, 7 * 20 * 0.62));
    expect(fitted.length).toBeLessThan(6);
    expect(fitted.length).toBeGreaterThanOrEqual(1);
  });
});
