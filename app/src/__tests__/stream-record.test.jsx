// =============================================================================
// DR-1045 — every service stream keeps its length, read against the window
// =============================================================================
// Darrell 2026-10-15: "Did we go over or under time based on the video stream
// that day?" Nothing held a stream's length, so it could not be answered. 0295
// adds the columns, the NAS stream-length rider fills them, and the Track
// record reads them as an upper bound on the service against 75–90 minutes.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { streamRecord } from '../lib/service-actuals.js';
import { toSermonShape } from '../lib/choir-sync.js';
import { TrackRecord } from '../components/ServiceActuals.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const sermon = (serviceDate, serviceType, streamSeconds, extra = {}) => ({ serviceDate, serviceType, streamSeconds, title: 'A service', videoId: `v-${serviceDate}`, status: 'active', ...extra });

describe('streamRecord — over, under or inside, by the stream', () => {
  it('reads each stream against 75–90 and names over and under by minutes', () => {
    const st = streamRecord([
      sermon('2026-10-11', 'sunday', 92 * 60 + 10),
      sermon('2026-10-07', 'wednesday', 70 * 60),
      sermon('2026-10-04', 'sunday', 84 * 60),
    ]);
    expect(st.rows.map((r) => [r.serviceDate, r.minutes, r.verdict])).toEqual([
      ['2026-10-11', 92, 'over'], ['2026-10-07', 70, 'under'], ['2026-10-04', 84, 'inside'],
    ]);
    expect(st.rows[0].window.say).toBe('2′ over the 90′ limit');
    expect(st.rows[1].window.say).toBe('5′ under the 75′ floor');
    expect(st).toMatchObject({ count: 3, inside: 1, over: 1, under: 1, insidePct: 33, avgMinutes: 82 });
    expect(st.rows.every((r) => r.upperBound === true)).toBe(true);
  });

  it('only Sundays and Wednesdays with a length; a funeral, an unread video and an archived row are left out', () => {
    const st = streamRecord([
      sermon('2026-10-10', 'funeral', 3600),
      sermon('2026-10-11', 'sunday', null),
      sermon('2026-10-04', 'sunday', 5000, { status: 'archived' }),
      sermon('2026-09-27', 'sunday', 5000),
    ]);
    expect(st.rows.map((r) => r.serviceDate)).toEqual(['2026-09-27']);
  });

  it('one service with two videos is read once, the longest kept', () => {
    const st = streamRecord([sermon('2026-10-11', 'sunday', 4000), sermon('2026-10-11', 'sunday', 5400)]);
    expect(st.count).toBe(1);
    expect(st.rows[0].minutes).toBe(90);
    expect(st.rows[0].verdict).toBe('inside');
  });

  it('nothing read is an empty record, never a painted zero', () => {
    expect(streamRecord([])).toMatchObject({ count: 0, insidePct: null, avgMinutes: null });
  });
});

describe('the database row carries the stream', () => {
  it('toSermonShape maps the three stream columns, and a missing length stays null', () => {
    const s = toSermonShape({ id: 's', service_date: '2026-10-11', stream_seconds: 5530, stream_started_at: '2026-10-11T16:00:00Z', stream_read_at: '2026-10-16T00:00:00Z' });
    expect(s).toMatchObject({ streamSeconds: 5530, streamStartedAt: '2026-10-11T16:00:00Z', streamReadAt: '2026-10-16T00:00:00Z' });
    expect(toSermonShape({ id: 't' }).streamSeconds).toBe(null);
  });
});

describe('0295 — additive columns, no policy change', () => {
  const sql = readFileSync(join(ROOT, 'infra', 'supabase', 'migrations-auto', '0295-every-service-stream-keeps-its-length.sql'), 'utf8').replace(/--.*$/gm, '');
  it('adds the stream columns and the caption timings idempotently', () => {
    for (const col of ['stream_seconds integer', 'stream_started_at timestamptz', 'stream_read_at timestamptz']) {
      expect(sql).toContain(`ALTER TABLE public.choir_sermons ADD COLUMN IF NOT EXISTS ${col}`);
    }
    expect(sql).toContain('ALTER TABLE public.video_transcripts ADD COLUMN IF NOT EXISTS segments jsonb');
    expect(sql).toMatch(/stream_seconds IS NULL OR \(stream_seconds > 0 AND stream_seconds < 86400\)/);
  });
  it('carries no policy, grant, drop or delete', () => {
    expect(sql).not.toMatch(/CREATE POLICY|DROP POLICY|GRANT |DROP TABLE|DROP COLUMN|DELETE FROM/i);
  });
});

describe('the Track record shows the stream', () => {
  let container, root;
  afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
  const mount = async (props) => {
    container = document.createElement('div'); document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(createElement(TrackRecord, props)); });
  };

  it('with a stream read, it says over or under and that the stream is an upper bound', async () => {
    await mount({ sermons: [sermon('2026-10-11', 'sunday', 92 * 60, { title: 'Keep Reaching!' })] });
    const block = container.querySelector('[data-testid="stream-record"]');
    expect(block).not.toBeNull();
    expect(block.textContent).toContain('Keep Reaching!');
    expect(block.textContent).toContain('stream 1:32');
    expect(block.textContent).toContain('2′ over the 90′ limit');
    expect(container.querySelector('[data-testid="stream-upper-bound"]').textContent).toMatch(/most the service could have taken/);
    // the clocked record still says it has nothing clocked
    expect(container.querySelector('[data-testid="track-record-empty"]')).not.toBeNull();
  });

  it('with nothing read, it says so plainly', async () => {
    await mount({ sermons: [] });
    expect(container.querySelector('[data-testid="stream-record-empty"]')).not.toBeNull();
  });
});
