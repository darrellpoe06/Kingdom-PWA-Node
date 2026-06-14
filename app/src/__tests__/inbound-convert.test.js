// Regression test for A2 (rigorous-review 2026-06-13): a converted voicemail
// must mark-handled on the backend BEFORE the local record is created. If the
// PATCH fails, nothing is created — otherwise a failed mark-handled leaves the
// voicemail re-convertible and the next attempt double-creates the record (and
// a failed "discard" silently resurfaces it). Locks both the ordering invariant
// and the payload mapping. Pairs with RELEASE-LANE.md (every fixed bug earns its
// regression test in the same PR).
import { describe, it, expect, vi } from 'vitest';
import { buildConvertPayload, convertInbound } from '../components/Inbound.jsx';

describe('convertInbound — mark-handled-first ordering (A2)', () => {
  it('does NOT create the local record when markHandled fails', async () => {
    const createLocalRecord = vi.fn();
    const markHandled = vi.fn().mockResolvedValue(false);
    const result = await convertInbound({ markHandled, createLocalRecord });
    expect(markHandled).toHaveBeenCalledTimes(1);
    expect(createLocalRecord).not.toHaveBeenCalled(); // the core of A2: no double-convert
    expect(result).toEqual({ handled: false, created: false });
  });

  it('creates the local record exactly once, AFTER markHandled succeeds', async () => {
    const calls = [];
    const markHandled = vi.fn(async () => { calls.push('handled'); return true; });
    const createLocalRecord = vi.fn(() => { calls.push('created'); });
    const result = await convertInbound({ markHandled, createLocalRecord });
    expect(createLocalRecord).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['handled', 'created']); // ordering: handle, then create
    expect(result).toEqual({ handled: true, created: true });
  });

  it('does not create twice across a failed-then-retried convert (the double-convert it prevents)', async () => {
    const createLocalRecord = vi.fn();
    // First attempt: backend down -> false. No record.
    const fail = vi.fn().mockResolvedValue(false);
    await convertInbound({ markHandled: fail, createLocalRecord });
    // Retry: backend up -> true. Exactly one record total.
    const ok = vi.fn().mockResolvedValue(true);
    await convertInbound({ markHandled: ok, createLocalRecord });
    expect(createLocalRecord).toHaveBeenCalledTimes(1);
  });
});

describe('buildConvertPayload — deterministic record mapping', () => {
  const today = '2026-06-14';

  it('maps an incident with the property category for the real-estate line', () => {
    const { kind, payload } = buildConvertPayload(
      { line: 'poe-properties', caller: '555', transcript: 'leak in 4B' }, 'incident', '', '', today,
    );
    expect(kind).toBe('incident');
    expect(payload.category).toBe('tenant-or-property');
    expect(payload.entityId).toBe('e-poeprops'); // line-default entity when none chosen
    expect(payload.date).toBe(today);
    expect(payload.description).toContain('leak in 4B');
  });

  it('maps an inquiry and carries the note into the description', () => {
    const { kind, payload } = buildConvertPayload(
      { line: 'poetech', caller: '555', transcript: 'wants a quote' }, 'inquiry', 'call back AM', '', today,
    );
    expect(kind).toBe('inquiry');
    expect(payload.source).toBe('inbound-voicemail');
    expect(payload.notes).toContain('wants a quote');
    expect(payload.notes).toContain('call back AM');
  });

  it('maps a project with the chosen entity overriding the line default', () => {
    const { kind, payload } = buildConvertPayload(
      { line: 'poetech', caller: 'Acme', transcript: 'new build' }, 'project', '', 'e-custom', today,
    );
    expect(kind).toBe('project');
    expect(payload.entityId).toBe('e-custom');
    expect(payload.domain).toBe('business-poetech');
    expect(payload.startDate).toBe(today);
  });

  it('returns a null record for an unknown convert kind', () => {
    expect(buildConvertPayload({ line: 'poetech' }, 'nonsense', '', '', today)).toEqual({ kind: null, payload: null });
  });
});
