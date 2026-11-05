// =============================================================================
// eol-register (DR-1341, DR-1330 D12): a pinned runtime past its end of life
// is red; a pin with no line is red; a retired runtime needs a why and a
// date; a date inside the horizon warns. Proven on fixtures; the live
// register passes today and every date it carries names its source.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { judge, pinsIn, REGISTER } from '../../../scripts/eol-register.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LIVE = JSON.parse(readFileSync(join(ROOT, REGISTER), 'utf8'));
const reg = (runtimes) => ({ warnDays: 120, source: { name: 't', commit: 'abc' }, runtimes });

describe('eol-register: proven to catch', () => {
  it('fails a pinned runtime past its date', () => {
    const r = judge({ register: reg([{ product: 'nodejs', cycle: '20', eol: '2026-04-30', pinned: true, where: 'x' }]), pins: [], today: '2026-11-05' });
    expect(r.failures[0]).toMatch(/nodejs 20 is pinned .* reached end of life on 2026-04-30/);
  });
  it('warns inside the horizon and passes beyond it', () => {
    const near = judge({ register: reg([{ product: 'nodejs', cycle: '22', eol: '2027-01-01', pinned: true, where: 'x' }]), pins: [], today: '2026-11-05' });
    expect(near.failures).toEqual([]);
    expect(near.warnings[0]).toMatch(/within 120 days/);
    const far = judge({ register: reg([{ product: 'nodejs', cycle: '22', eol: '2027-04-30', pinned: true, where: 'x' }]), pins: [], today: '2026-11-05' });
    expect(far.failures).toEqual([]);
    expect(far.warnings).toEqual([]);
  });
  it('fails a pin in the repo that has no line', () => {
    const r = judge({ register: reg([]), pins: [{ product: 'python', cycle: '3.12' }], today: '2026-11-05' });
    expect(r.failures[0]).toMatch(/python 3.12 is pinned in the repo but has no line/);
  });
  it('a retired runtime past its date needs a why and a future re-review', () => {
    const base = { product: 'python', cycle: '3.8', eol: '2024-10-07', pinned: false, status: 'retired-from-use' };
    expect(judge({ register: reg([base]), pins: [], today: '2026-11-05' }).failures[0]).toMatch(/without a why/);
    expect(judge({ register: reg([{ ...base, why: 'w', reReview: '2026-11-01' }]), pins: [], today: '2026-11-05' }).failures[0]).toMatch(
      /passed its re-review/
    );
    expect(judge({ register: reg([{ ...base, why: 'w', reReview: '2026-12-05' }]), pins: [], today: '2026-11-05' }).failures).toEqual([]);
  });
  it('reads node, python and postgres pins', () => {
    expect(pinsIn("node-version: '22'\npython-version: '3.12'\nimage: postgres:16\nimage: supabase/postgres:15.8.1.060")).toEqual([
      { product: 'nodejs', cycle: '22' },
      { product: 'python', cycle: '3.12' },
      { product: 'postgresql', cycle: '16' },
      { product: 'postgresql', cycle: '15' },
    ]);
  });
});

describe('eol-register: the live register', () => {
  it('names its source commit and carries a date or a stated none on every pinned line', () => {
    expect(LIVE.source.commit).toMatch(/^[0-9a-f]{40}$/);
    for (const r of LIVE.runtimes.filter((x) => x.pinned)) expect(r.eol === null ? typeof r.note : typeof r.eol, `${r.product} ${r.cycle}`).toBe('string');
  });
  it("passes today against the repo's own pins", () => {
    const { failures } = judge({
      register: LIVE,
      pins: [
        { product: 'nodejs', cycle: '22' },
        { product: 'python', cycle: '3.11' },
        { product: 'python', cycle: '3.12' },
        { product: 'postgresql', cycle: '16' },
        { product: 'postgresql', cycle: '15' },
      ],
      today: '2026-11-05',
    });
    expect(failures).toEqual([]);
  });
});
