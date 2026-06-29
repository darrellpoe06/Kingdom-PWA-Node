// Voice layer — the two BRIGHT LINES, proven-to-catch.
//   1. No clone / no use of a personal voice without GRANTED consent.
//   2. No personal voice is ever reported as the person's REAL cloned timbre
//      before the sovereign voice service is live (no-lie provider gate).
import { describe, it, expect } from 'vitest';
import {
  KIND, CONSENT, ENTITLEMENT, PROVIDER,
  SYSTEM_VOICE, SEED_PERSONAL_VOICES,
  mergeVoiceCatalog, canCloneVoice, isVoiceEntitled, isVoiceSelectable,
  resolveVoiceProvider, aiVoiceLabel, enrollmentStatus, applyConsent,
  loadVoiceChoice, saveVoiceChoice,
} from '../lib/voice-registry.js';
import { enrollmentToRow, profileFromRow } from '../lib/voice-sync.js';

const personal = (over = {}) => ({
  id: 'voice-x', kind: KIND.PERSONAL, personKey: 'x', name: 'X',
  consentState: CONSENT.NONE, entitlement: ENTITLEMENT.SUBSCRIBER,
  providerHint: PROVIDER.SOVEREIGN_CLONE, ...over,
});

describe('seed catalog is consent-safe by construction', () => {
  it('no personal seed voice ships pre-granted', () => {
    for (const v of SEED_PERSONAL_VOICES) expect(v.consentState).toBe(CONSENT.NONE);
  });
  it('the named candidates are present (DP / CP / BG)', () => {
    const keys = SEED_PERSONAL_VOICES.map((v) => v.personKey);
    expect(keys).toEqual(expect.arrayContaining(['darrell', 'christina', 'bishop-gwin']));
  });
  it('system voice is free + synthetic', () => {
    expect(SYSTEM_VOICE.kind).toBe(KIND.SYNTHETIC);
    expect(SYSTEM_VOICE.entitlement).toBe(ENTITLEMENT.FREE);
  });
});

describe('BRIGHT LINE 1 — consent gate', () => {
  it('canCloneVoice is false for a personal voice unless GRANTED', () => {
    expect(canCloneVoice(personal({ consentState: CONSENT.NONE }))).toBe(false);
    expect(canCloneVoice(personal({ consentState: CONSENT.REQUESTED }))).toBe(false);
    expect(canCloneVoice(personal({ consentState: CONSENT.DECLINED }))).toBe(false);
    expect(canCloneVoice(personal({ consentState: CONSENT.REVOKED }))).toBe(false);
    expect(canCloneVoice(personal({ consentState: CONSENT.GRANTED }))).toBe(true);
  });
  it('synthetic voices need no consent', () => {
    expect(canCloneVoice(SYSTEM_VOICE)).toBe(true);
  });
  it('a non-granted personal voice is NOT selectable even if entitled', () => {
    const v = personal({ consentState: CONSENT.NONE });
    expect(isVoiceSelectable(v, { isOwner: true, subscribed: true })).toBe(false);
  });
});

describe('entitlement gate — voice as a subscriber feature', () => {
  it('a granted personal voice still needs entitlement', () => {
    const v = personal({ consentState: CONSENT.GRANTED });
    expect(isVoiceSelectable(v, { subscribed: false, isOwner: false })).toBe(false);
    expect(isVoiceSelectable(v, { subscribed: true })).toBe(true);
    expect(isVoiceSelectable(v, { isOwner: true })).toBe(true); // owner / building circle
  });
  it('free voices bypass entitlement', () => {
    expect(isVoiceEntitled(SYSTEM_VOICE, {})).toBe(true);
    expect(isVoiceSelectable(SYSTEM_VOICE, {})).toBe(true);
  });
});

describe('BRIGHT LINE 2 — no-lie provider gate', () => {
  it('a consented personal voice is a labeled STAND-IN (never real) before the service is live', () => {
    const v = personal({ consentState: CONSENT.GRANTED });
    const r = resolveVoiceProvider(v, { sovereignVoiceReady: false });
    expect(r.real).toBe(false);
    expect(r.standIn).toBe(true);
    expect(r.provider).toBe(PROVIDER.BROWSER);
    expect(r.note).toMatch(/stand-in/i);
  });
  it('only with the sovereign service live does it become the real cloned timbre', () => {
    const v = personal({ consentState: CONSENT.GRANTED });
    const r = resolveVoiceProvider(v, { sovereignVoiceReady: true });
    expect(r.real).toBe(true);
    expect(r.provider).toBe(PROVIDER.SOVEREIGN_CLONE);
  });
  it('a non-consented personal voice is BLOCKED — nothing plays, never browser-as-real', () => {
    const r = resolveVoiceProvider(personal({ consentState: CONSENT.NONE }), { sovereignVoiceReady: true });
    expect(r.blocked).toBe(true);
    expect(r.provider).toBe(PROVIDER.NONE);
    expect(r.real).toBe(false);
  });
  it('synthetic voice is real and unblocked', () => {
    const r = resolveVoiceProvider(SYSTEM_VOICE, { sovereignVoiceReady: false });
    expect(r.real).toBe(true);
    expect(r.blocked).toBe(false);
  });
});

describe('labeling', () => {
  it('every personal voice carries an AI-generated label; synthetic does not', () => {
    expect(aiVoiceLabel(personal())).toBe('AI-generated voice');
    expect(aiVoiceLabel(SYSTEM_VOICE)).toBeNull();
  });
});

describe('consent state machine (self-consent, pure)', () => {
  it('grant moves none -> granted and stamps provenance', () => {
    const { ok, voice } = applyConsent(personal(), 'grant', { by: 'u1', at: 't', scope: 'read-aloud-narration' });
    expect(ok).toBe(true);
    expect(voice.consentState).toBe(CONSENT.GRANTED);
    expect(voice.consentBy).toBe('u1');
  });
  it('revoke only from granted', () => {
    expect(applyConsent(personal({ consentState: CONSENT.NONE }), 'revoke').ok).toBe(false);
    expect(applyConsent(personal({ consentState: CONSENT.GRANTED }), 'revoke').ok).toBe(true);
  });
  it('cannot consent on a synthetic voice', () => {
    expect(applyConsent(SYSTEM_VOICE, 'grant').ok).toBe(false);
  });
});

describe('mergeVoiceCatalog — persisted profiles are authoritative', () => {
  it('a granted profile flips the matching seed voice to usable', () => {
    const list = mergeVoiceCatalog([
      { personKey: 'darrell', displayName: 'Darrell Poe', consentState: CONSENT.GRANTED, entitlement: ENTITLEMENT.SUBSCRIBER },
    ]);
    const dp = list.find((v) => v.personKey === 'darrell');
    expect(dp.consentState).toBe(CONSENT.GRANTED);
    expect(canCloneVoice(dp)).toBe(true);
    // others remain not-enrolled
    const bg = list.find((v) => v.personKey === 'bishop-gwin');
    expect(canCloneVoice(bg)).toBe(false);
  });
  it('an enrolled person not in the seed is appended', () => {
    const list = mergeVoiceCatalog([
      { personKey: 'freddie', displayName: 'Freddie', consentState: CONSENT.GRANTED },
    ]);
    expect(list.some((v) => v.personKey === 'freddie')).toBe(true);
  });
  it('system voice is always first', () => {
    expect(mergeVoiceCatalog([])[0].id).toBe(SYSTEM_VOICE.id);
  });
});

describe('enrollment row (self-consent write)', () => {
  it('stamps created_by = caller and consent granted', () => {
    const row = enrollmentToRow({ instanceId: 'i1', userId: 'u9', personKey: 'darrell', displayName: 'Darrell Poe' });
    expect(row.created_by).toBe('u9');
    expect(row.consent_state).toBe(CONSENT.GRANTED);
    expect(row.ai_label).toBe(true);
  });
  it('round-trips through profileFromRow', () => {
    const row = { id: 'r1', instance_id: 'i1', created_by: 'u9', person_key: 'darrell',
      display_name: 'Darrell Poe', consent_state: 'granted', entitlement: 'subscriber',
      provider_hint: 'sovereign-clone', ai_label: true };
    const p = profileFromRow(row);
    expect(p.personKey).toBe('darrell');
    expect(p.consentState).toBe('granted');
    expect(p.remoteId).toBe('r1');
  });
});

describe('per-device voice choice', () => {
  it('defaults to the system voice and round-trips', () => {
    const store = (() => { let s = {}; return { getItem: (k) => s[k] ?? null, setItem: (k, v) => { s[k] = v; } }; })();
    expect(loadVoiceChoice(store)).toBe(SYSTEM_VOICE.id);
    saveVoiceChoice('voice-dp', store);
    expect(loadVoiceChoice(store)).toBe('voice-dp');
  });
  it('enrollmentStatus labels each consent state', () => {
    expect(enrollmentStatus(personal({ consentState: CONSENT.GRANTED })).tone).toBe('ok');
    expect(enrollmentStatus(personal({ consentState: CONSENT.NONE })).tone).toBe('pending');
  });
});
