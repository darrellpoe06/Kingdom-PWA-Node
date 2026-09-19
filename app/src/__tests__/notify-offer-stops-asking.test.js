// @vitest-environment node
// =============================================================================
// AGREEING MUST SILENCE THE OFFER
// =============================================================================
// Darrell 2026-09-19, with a screenshot of the offer on his phone, over a
// lesson he was reading:
//
//   "I get a lot of requests for getting notifications however why does it
//    keep asking after agreeing to?"
//
// Because agreement was never what the offer measured. readinessFrom() only
// reported 'on' for `subscribed && permission === 'granted'`. A person could
// tap the button, the browser could GRANT, and if the subscribe step then
// failed the state fell through to plain 'off' -- so the identical "Turn on
// notifications" card came back on the next load, asking him to do a thing he
// had already done. Nothing recorded the attempt, so nothing could quiet it.
//
// Two fixes, both pinned here:
//   1. 'permitted' is its own state. Granted-but-unregistered is not "turn on
//      notifications"; it is "you said yes, this device is not registered".
//      The old copy was a lie to someone who had already agreed.
//   2. An ATTEMPT quiets the offer the way a dismissal does, so a silent
//      failure cannot re-ask immediately.
import { describe, it, expect } from 'vitest';
import {
  readinessFrom, shouldOfferNotifications, snoozeActive,
  NOTIFY_SNOOZE_DAYS, NOTIFY_ATTEMPT_QUIET_DAYS,
} from '../lib/notify-readiness.js';

const DAY = 86400000;
const NOW = Date.parse('2026-09-19T18:00:00Z');
const ago = (days) => new Date(NOW - days * DAY).toISOString();

describe('the exact shape Darrell hit', () => {
  it('PROVEN-TO-CATCH: granted-but-unregistered is no longer the plain ask', () => {
    const r = readinessFrom({ permission: 'granted', subscribed: false });
    // The old behaviour returned state 'off' with the "Turn on notifications"
    // headline here. That is what produced the repeat ask.
    expect(r.state).not.toBe('off');
    expect(r.state).toBe('permitted');
    expect(r.headline).not.toMatch(/^Turn on notifications/);
    expect(r.headline, 'it must acknowledge that he already agreed').toMatch(/said yes/i);
  });

  it('and it does not pretend the person still has to allow anything', () => {
    const r = readinessFrom({ permission: 'granted', subscribed: false });
    expect(r.detail).toMatch(/already allows/i);
    expect(r.canAct, 'a retry must still be possible').toBe(true);
  });

  it('having ACTED silences the offer, even though registration did not finish', () => {
    const r = readinessFrom({ permission: 'granted', subscribed: false });
    // The nag: acted a minute ago, subscribe failed, page reloads.
    expect(shouldOfferNotifications(r, {
      signedIn: true, attemptedAt: new Date(NOW - 60000).toISOString(), now: NOW,
    }), 'it must not ask again right after he agreed').toBe(false);
  });

  it('PROVEN-TO-CATCH: with no attempt recorded, it WOULD ask again', () => {
    // The control. If this ever stops being true the test above is proving
    // nothing, because the offer would be suppressed for some other reason.
    const r = readinessFrom({ permission: 'granted', subscribed: false });
    expect(shouldOfferNotifications(r, { signedIn: true, attemptedAt: null, now: NOW })).toBe(true);
  });
});

describe('the quiet windows are real, and neither is forever', () => {
  it('an attempt goes quiet for a day and then offers the retry again', () => {
    const r = readinessFrom({ permission: 'granted', subscribed: false });
    const inside = { signedIn: true, attemptedAt: ago(NOTIFY_ATTEMPT_QUIET_DAYS - 0.5), now: NOW };
    const outside = { signedIn: true, attemptedAt: ago(NOTIFY_ATTEMPT_QUIET_DAYS + 1), now: NOW };
    expect(shouldOfferNotifications(r, inside)).toBe(false);
    expect(shouldOfferNotifications(r, outside), 'a retry must eventually come back').toBe(true);
  });

  it('a dismissal still holds for its own longer window', () => {
    const r = readinessFrom({ permission: 'default', subscribed: false });
    expect(r.state).toBe('off');
    expect(shouldOfferNotifications(r, { signedIn: true, dismissedAt: ago(NOTIFY_SNOOZE_DAYS - 1), now: NOW })).toBe(false);
    expect(shouldOfferNotifications(r, { signedIn: true, dismissedAt: ago(NOTIFY_SNOOZE_DAYS + 1), now: NOW })).toBe(true);
  });

  it('an unparseable or absent stamp never silences the offer by accident', () => {
    expect(snoozeActive(null, NOW)).toBe(false);
    expect(snoozeActive('not a date', NOW)).toBe(false);
    expect(snoozeActive('', NOW)).toBe(false);
  });
});

describe('the states that must never be nagged at all', () => {
  it('a fully-on device is never offered anything', () => {
    const r = readinessFrom({ permission: 'granted', subscribed: true });
    expect(r.state).toBe('on');
    expect(shouldOfferNotifications(r, { signedIn: true, now: NOW })).toBe(false);
  });

  it('a blocked browser is told the truth and never interrupted', () => {
    const r = readinessFrom({ permission: 'denied' });
    expect(r.state).toBe('blocked');
    expect(r.canAct).toBe(false);
    expect(shouldOfferNotifications(r, { signedIn: true, now: NOW })).toBe(false);
  });

  it('a signed-out visitor is never offered a device-bound subscription', () => {
    const r = readinessFrom({ permission: 'default' });
    expect(shouldOfferNotifications(r, { signedIn: false, now: NOW })).toBe(false);
  });
});
