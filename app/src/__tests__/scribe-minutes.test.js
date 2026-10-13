// scribe-minutes.test.js — proven-to-catch coverage for the scribe_sessions
// load rules + lifecycle (migration 0121, DR-0236). Each test fires the class
// it guards: consent-less rows, over-cap rows, lifecycle skipping, wrong-kind
// meeting joins, tenant-less inserts.
import { describe, it, expect } from 'vitest';
import { buildConsent, buildManifest, SCRIBE_MAX_DURATION_MIN } from '../lib/workflow-scribe.js';
import {
  canTransition, validateSessionRow, buildSessionRow, applyPipelineResult,
} from '../lib/scribe-minutes.js';

const soundManifest = (kind = 'meeting') => buildManifest({
  sessionId: 'abc12345', kind, mime: 'audio/webm', startedAtIso: '2026-07-27T18:00:00.000Z',
  seconds: 3600, chunkCount: 60, steps: [],
  consent: buildConsent([{ name: 'Darrell', consented: true }, { name: 'Christyn', consented: true }]),
});

describe('lifecycle — one honest step at a time', () => {
  it('allows the real pipeline path', () => {
    expect(canTransition('recorded', 'queued')).toBe(true);
    expect(canTransition('queued', 'transcribed')).toBe(true);
    expect(canTransition('transcribed', 'minuted')).toBe(true);
  });
  it('CATCHES skipping (recorded -> minuted must be impossible)', () => {
    expect(canTransition('recorded', 'minuted')).toBe(false);
    expect(canTransition('recorded', 'transcribed')).toBe(false);
  });
  it('failed and minuted are terminal — no silent un-failing', () => {
    expect(canTransition('failed', 'queued')).toBe(false);
    expect(canTransition('minuted', 'queued')).toBe(false);
  });
});

describe('validateSessionRow — the schema rules held in JS too', () => {
  const sound = {
    session_id: 's1', kind: 'meeting', seconds: 3600,
    consent: buildConsent([{ name: 'D', consented: true }]), status: 'recorded',
  };
  it('a sound row passes', () => {
    expect(validateSessionRow(sound)).toEqual({ ok: true, problems: [] });
  });
  it('CATCHES a consent-less row', () => {
    expect(validateSessionRow({ ...sound, consent: buildConsent([]) }).problems).toContain('consent-missing');
  });
  it('CATCHES an over-cap duration', () => {
    expect(validateSessionRow({ ...sound, seconds: SCRIBE_MAX_DURATION_MIN * 60 + 1 }).problems).toContain('over-duration-cap');
  });
  it('CATCHES a workflow session claiming a meeting join', () => {
    expect(validateSessionRow({ ...sound, kind: 'workflow', meeting_id: 'm1' }).problems)
      .toContain('meeting-join-requires-meeting-kind');
  });
});

describe('buildSessionRow — the manifest-to-row mapper refuses bad captures', () => {
  const ids = { instanceId: 'inst-1', userId: 'user-1' };
  it('maps a sound meeting manifest faithfully', () => {
    const out = buildSessionRow(soundManifest(), { ...ids, meetingId: 'meet-1' });
    expect(out.ok).toBe(true);
    expect(out.row).toMatchObject({
      instance_id: 'inst-1', session_id: 'abc12345', kind: 'meeting',
      meeting_id: 'meet-1', seconds: 3600, status: 'recorded', created_by: 'user-1',
    });
    expect(out.row.consent.allConsented).toBe(true);
  });
  it('CATCHES an invalid manifest instead of laundering it into a row', () => {
    const bad = { ...soundManifest(), consent: buildConsent([]) };
    const out = buildSessionRow(bad, ids);
    expect(out.ok).toBe(false);
    expect(out.row).toBeNull();
    expect(out.problems).toContain('consent-missing');
  });
  it('CATCHES a workflow manifest pointed at a meeting row', () => {
    const out = buildSessionRow(soundManifest('workflow'), { ...ids, meetingId: 'meet-1' });
    expect(out.problems).toContain('meeting-join-requires-meeting-kind');
  });
  it('CATCHES a tenant-less insert (the P35 class)', () => {
    const out = buildSessionRow(soundManifest(), { instanceId: '', userId: 'user-1' });
    expect(out.problems).toContain('missing-tenant-or-user');
  });
});

describe('applyPipelineResult — NAS results land only where the lifecycle allows', () => {
  it('a transcript lands on a queued session', () => {
    const out = applyPipelineResult({ status: 'queued' }, { transcript: { text: 'hello' } });
    expect(out.ok).toBe(true);
    expect(out.patch.status).toBe('transcribed');
  });
  it('CATCHES a transcript landing on a recorded (never-queued) session', () => {
    const out = applyPipelineResult({ status: 'recorded' }, { transcript: { text: 'x' } });
    expect(out.ok).toBe(false);
    expect(out.problem).toBe('illegal-transition:recorded->transcribed');
  });
  it('minutes land only on a transcribed session', () => {
    expect(applyPipelineResult({ status: 'transcribed' }, { minutesMd: '# Minutes' }).ok).toBe(true);
    expect(applyPipelineResult({ status: 'queued' }, { minutesMd: '# Minutes' }).ok).toBe(false);
  });
  it('an empty result is refused, not silently a no-op success', () => {
    expect(applyPipelineResult({ status: 'queued' }, {}).ok).toBe(false);
  });
});
