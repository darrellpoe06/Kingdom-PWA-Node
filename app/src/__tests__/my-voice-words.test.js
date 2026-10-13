// The words for "My voice (Darrell)" in every state it can be in (DR-0721).
// Pure: lib/my-voice.js decides the name and the sentence, so a change to the
// wording is a change to this test.
import { describe, it, expect } from 'vitest';
import { MY_VOICE, firstNameOf, myVoiceLabel, myVoiceStatus, myVoiceLine, myVoiceUsable, standInWords } from '../lib/my-voice.js';

describe('the name', () => {
  it('is "My voice (Darrell)" for Darrell Poe, and plain "My voice" with no name', () => {
    expect(firstNameOf('Darrell Poe')).toBe('Darrell');
    expect(myVoiceLabel('Darrell Poe')).toBe('My voice (Darrell)');
    expect(myVoiceLabel('')).toBe('My voice');
  });
});

describe('the state', () => {
  it('no recording on this device outranks everything', () => {
    expect(myVoiceStatus({ hasSample: false, studio: 'up' })).toBe(MY_VOICE.SAMPLE_MISSING);
  });
  it('the last miss names its cause: road, key, sample, or other', () => {
    expect(myVoiceStatus({ hasSample: true, studio: 'up', miss: 'voice-service-404' })).toBe(MY_VOICE.STUDIO_OFFLINE);
    expect(myVoiceStatus({ hasSample: true, studio: 'up', miss: 'voice-service-timeout' })).toBe(MY_VOICE.STUDIO_OFFLINE);
    expect(myVoiceStatus({ hasSample: true, miss: 'voice-service-401' })).toBe(MY_VOICE.KEY_REFUSED);
    expect(myVoiceStatus({ hasSample: true, miss: 'no-voice-sample' })).toBe(MY_VOICE.SAMPLE_MISSING);
    expect(myVoiceStatus({ hasSample: true, miss: 'voice-service-400' })).toBe(MY_VOICE.FAILED);
  });
  it('with no miss, the probe decides: up is ready, down is offline, unknown is checking', () => {
    expect(myVoiceStatus({ hasSample: true, studio: 'up' })).toBe(MY_VOICE.READY);
    expect(myVoiceStatus({ hasSample: true, studio: 'down' })).toBe(MY_VOICE.STUDIO_OFFLINE);
    expect(myVoiceStatus({ hasSample: true, studio: 'unknown' })).toBe(MY_VOICE.CHECKING);
    expect(myVoiceUsable(MY_VOICE.READY)).toBe(true);
    expect(myVoiceUsable(MY_VOICE.STUDIO_OFFLINE)).toBe(false);
  });
});

describe('the sentence', () => {
  it('every not-ready state says whose voice reads instead, or what to do', () => {
    const off = myVoiceLine({ name: 'Darrell Poe', status: MY_VOICE.STUDIO_OFFLINE });
    expect(off).toMatch(/^My voice \(Darrell\) is not reading yet/);
    expect(off).toMatch(/4070 tower/);
    expect(off).toMatch(/stand-in voice reads instead/);
    expect(myVoiceLine({ name: 'Darrell Poe', status: MY_VOICE.SAMPLE_MISSING })).toMatch(/Voice tab on this device/);
    expect(myVoiceLine({ name: 'Darrell Poe', status: MY_VOICE.KEY_REFUSED })).toMatch(/family key/);
    expect(myVoiceLine({ name: 'Darrell Poe', status: MY_VOICE.FAILED, miss: 'voice-service-500' })).toMatch(/HTTP 500/);
    expect(myVoiceLine({ name: 'Darrell Poe', status: MY_VOICE.READY })).toMatch(/is ready/);
  });
  it('the status words beside Reading say "not your voice" when his own voice is replaced', () => {
    expect(standInWords('studio-offline', { mine: true })).toMatch(/not your voice/);
    expect(standInWords('studio-offline')).toBe(' · stand-in voice, the studio is offline');
    expect(standInWords('')).toBe('');
  });
});
