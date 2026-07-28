// @vitest-environment node
// =============================================================================
// cadence-guard — the check-in-interval gate, proven (DR-0103 §3 / DR-0076)
// =============================================================================
// Darrell 2026-07-28: "60 minutes? Why does Ari allow claude to undermine our
// projects?" The Stop hook reads reply TEXT and can't see a check-in interval
// (a tool arg). This gate does. Proven-to-catch: a reflexive long timer with no
// external wait is BLOCKED; a justified one, a short one, and every other tool
// pass through untouched.
import { describe, it, expect } from 'vitest';
import { classifyCadence } from '../../../scripts/cadence-guard-pretool-hook.mjs';

const send = (input) => classifyCadence({ toolName: 'mcp__Claude_Code_Remote__send_later', toolInput: input });

describe('classifyCadence — blocks the reflexive hour', () => {
  it('CATCHES a 60-minute check-in with no external wait named', () => {
    const v = send({ delay_minutes: 60, message: 'check on the PR again' });
    expect(v.block).toBe(true);
    expect(v.minutes).toBe(60);
    expect(v.reason).toMatch(/DR-0103/);
  });
  it('CATCHES a ScheduleWakeup with a long delaySeconds and no justification', () => {
    const v = classifyCadence({ toolName: 'ScheduleWakeup', toolInput: { delaySeconds: 3600, reason: 'loop again' } });
    expect(v.block).toBe(true);
  });
});

describe('classifyCadence — lets justified and short cadences through', () => {
  it('ALLOWS a long delay that names a genuine external wait (CI/deploy/migration)', () => {
    expect(send({ delay_minutes: 60, message: 'watch the CI run then the deploy' }).block).toBe(false);
    expect(send({ delay_minutes: 45, message: 'the db-migrate run applies on merge' }).block).toBe(false);
    expect(send({ delay_minutes: 480, message: 'overnight soak, re-check tomorrow' }).block).toBe(false);
  });
  it('ALLOWS a short check-in (matched to how fast the work changes)', () => {
    expect(send({ delay_minutes: 5, message: 'anything' }).block).toBe(false);
    expect(send({ delay_minutes: 20, message: 'anything' }).block).toBe(false);
  });
  it('ALLOWS a ScheduleWakeup stop-call (no delay to police)', () => {
    expect(classifyCadence({ toolName: 'ScheduleWakeup', toolInput: { stop: true } }).block).toBe(false);
  });
});

describe('classifyCadence — never touches other tools, fails open', () => {
  it('ignores every non-scheduling tool', () => {
    expect(classifyCadence({ toolName: 'Bash', toolInput: { command: 'sleep 3600' } }).block).toBe(false);
    expect(classifyCadence({ toolName: 'Edit', toolInput: {} }).block).toBe(false);
  });
  it('does not block when no delay is present (absolute-time / malformed)', () => {
    expect(send({ at: '2026-07-28T05:00:00Z', message: 'later' }).block).toBe(false);
    expect(send({}).block).toBe(false);
    expect(classifyCadence({}).block).toBe(false);
  });
});
