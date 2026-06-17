// photo-source-health — locks the honest "did the photo source resolve?" readout
// behind the Property Photos grid. Proven-to-catch (DR-0076): a wall of blank
// tiles (loaded photos, zero thumbnails) must read as a PROBLEM, never as a
// quiet "no photos" — and a fully-resolved set must read as good.
import { describe, it, expect } from 'vitest';
import { summarizePhotoSource } from '../lib/photo-source-health.js';
import { KPI_STATUS } from '../lib/kpi-status.js';

const px = (n, withThumb) => Array.from({ length: n }, (_, i) => ({
  id: `p${i}`, thumb: withThumb ? 'data:image/jpeg;base64,AAAA' : null,
}));

describe('summarizePhotoSource', () => {
  it('idle when nothing is loaded (never a false green)', () => {
    const s = summarizePhotoSource([]);
    expect(s.status).toBe('idle');
    expect(s.loaded).toBe(0);
    expect(s.resolved).toBe(0);
    expect(s.color).toBe(KPI_STATUS.idle.color);
  });

  it('is null-safe', () => {
    expect(summarizePhotoSource(null).status).toBe('idle');
    expect(summarizePhotoSource(undefined).loaded).toBe(0);
  });

  it('PROVEN-TO-CATCH: loaded photos but zero thumbnails reads as a problem', () => {
    const s = summarizePhotoSource(px(40, false));
    expect(s.status).toBe('problem');
    expect(s.resolved).toBe(0);
    expect(s.missing).toBe(40);
    expect(s.color).toBe(KPI_STATUS.problem.color);
    // The flag must NOT be idle/good — a silent blank wall is the bug we prevent.
    expect(s.status).not.toBe('idle');
    expect(s.status).not.toBe('good');
  });

  it('good when most resolve (>=60%)', () => {
    const s = summarizePhotoSource([...px(7, true), ...px(3, false)]);
    expect(s.status).toBe('good');
    expect(s.resolved).toBe(7);
    expect(s.missing).toBe(3);
    expect(Math.round(s.rate * 100)).toBe(70);
  });

  it('attention when a meaningful share is missing but some resolve', () => {
    const s = summarizePhotoSource([...px(3, true), ...px(7, false)]);
    expect(s.status).toBe('attention');
    expect(s.resolved).toBe(3);
  });

  it('all-resolved reads good with an all-loaded label', () => {
    const s = summarizePhotoSource(px(12, true));
    expect(s.status).toBe('good');
    expect(s.missing).toBe(0);
    expect(s.label).toMatch(/All 12/);
  });

  it('reports archive total independent of the loaded page', () => {
    const s = summarizePhotoSource(px(18, true), { total: 233 });
    expect(s.total).toBe(233);
    expect(s.loaded).toBe(18);
  });

  it('label names the missing count so it is never silent', () => {
    const s = summarizePhotoSource([...px(2, true), ...px(8, false)]);
    expect(s.label).toMatch(/8 not in backup/);
  });
});
