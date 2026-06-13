// @vitest-environment node
//
// Voice-worker security coverage (audit P7) — the Twilio webhook is an
// external, unauthenticated-by-default input surface that had ZERO tests. The
// only thing standing between a stranger and a forged voicemail row is the
// HMAC-SHA1 signature check; these tests prove it actually validates a genuine
// Twilio signature and rejects a forged one. Node env (real crypto.subtle).
import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyTwilioSignature, inferLineFromNumber } from '../../../backend/voice-worker/src/index.js';

// Reproduce Twilio's signing exactly: url + each sorted key+value, HMAC-SHA1,
// base64. This is how Twilio computes X-Twilio-Signature.
function twilioSign(token, url, params) {
  const sorted = [...Object.keys(params)].sort();
  let s = url;
  for (const k of sorted) s += k + params[k];
  return createHmac('sha1', token).update(s).digest('base64');
}

const TOKEN = 'test_auth_token_123';
const URL_ = 'https://poetech-voice-ops.workers.dev/webhook/twilio';
const PARAMS = { CallSid: 'CA123', From: '+12175551212', To: '+12175550000', RecordingSid: 'RE9' };
const BODY = new URLSearchParams(PARAMS).toString();

describe('verifyTwilioSignature', () => {
  it('accepts a correctly-signed request', async () => {
    const sig = twilioSign(TOKEN, URL_, PARAMS);
    expect(await verifyTwilioSignature(TOKEN, URL_, BODY, sig)).toBe(true);
  });

  it('rejects a forged / tampered signature', async () => {
    expect(await verifyTwilioSignature(TOKEN, URL_, BODY, 'not-a-real-signature')).toBe(false);
  });

  it('rejects when the body was tampered after signing', async () => {
    const sig = twilioSign(TOKEN, URL_, PARAMS);
    const tampered = new URLSearchParams({ ...PARAMS, From: '+19990000000' }).toString();
    expect(await verifyTwilioSignature(TOKEN, URL_, tampered, sig)).toBe(false);
  });

  it('rejects when the token is wrong (signed with a different secret)', async () => {
    const sig = twilioSign('a_different_token', URL_, PARAMS);
    expect(await verifyTwilioSignature(TOKEN, URL_, BODY, sig)).toBe(false);
  });

  it('returns false with no token or no signature header', async () => {
    expect(await verifyTwilioSignature('', URL_, BODY, 'x')).toBe(false);
    expect(await verifyTwilioSignature(TOKEN, URL_, BODY, '')).toBe(false);
  });
});

describe('inferLineFromNumber', () => {
  it('returns null for no number', () => {
    expect(inferLineFromNumber(null, ['poe-properties', 'poetech'])).toBe(null);
  });
  it('falls back to the first allowed line (Studio should send Line explicitly)', () => {
    expect(inferLineFromNumber('+12175550000', ['poe-properties', 'poetech'])).toBe('poe-properties');
  });
});
