// The key provisions itself before the read (DR-0574).
//
// The evening's chain ended on a row that said "Provision this device's bridge
// key" — a chore handed to a person — while the machine path already existed:
// bridge-provision.js pulls the family key through the RLS-deny-all +
// SECURITY DEFINER RPC pair of migration 0128 into the same localStorage slot
// every NAS read uses. It was called from exactly ONE place, Rentals.jsx, so a
// device that had never opened Real Estate was refused at the studio door
// with a key it could have had. DR-0108: "a stated must-be-by-hand is an
// unverified premise to challenge, not a place to stop."
//
// Now the read asks for the key itself before its first studio attempt, the
// studio asks the moment a signed-in person opens it, and the row reports what
// came back — present, provisioned just now, or none — naming the one human
// step that remains (a steward publishes it once) only when the family has
// genuinely published nothing.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildVoiceChecks, PASS, FAIL } from '../lib/voice-system-check.js';
import { provisionBridgeToken } from '../lib/bridge-provision.js';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';

const HOOK = readFileSync(resolve(__dirname, '../lib/use-read-aloud.js'), 'utf8');
const STUDIO = readFileSync(resolve(__dirname, '../components/VoiceStudio.jsx'), 'utf8');
const RENTALS = readFileSync(resolve(__dirname, '../components/Rentals.jsx'), 'utf8');

const base = {
  signedIn: true, enrolKey: 'darrell', instanceId: 'i1', reviewerMode: false,
  recorderSupported: true, sampleOnDevice: true, consentRow: true, studioHealth: 'up',
};
const row = (m) => buildVoiceChecks({ ...base, ...m }).find((r) => r.id === 'bridge-key');

describe('REPRODUCES THE GAP: the machine path existed and only Real Estate ran it', () => {
  it('Rentals was the only caller before this record', () => {
    expect(RENTALS).toMatch(/provisionBridgeToken\(supabase\)/);
  });

  it('the read now asks for the key before its first studio attempt', () => {
    expect(HOOK).toMatch(/import \{ provisionBridgeToken \} from '\.\/bridge-provision\.js';/);
    const attempt = HOOK.indexOf('if (voice && attemptStudio) {');
    const ask = HOOK.indexOf('if (!hasBridgeToken()) await provisionBridgeToken(supabase);');
    const speak = HOOK.indexOf('synthesizeSpeech({', attempt);
    expect(attempt).toBeGreaterThan(0);
    expect(ask).toBeGreaterThan(attempt);
    expect(ask).toBeLessThan(speak);
  });

  it('the studio asks the moment a signed-in person opens it, and feeds the answer to the panel', () => {
    expect(STUDIO).toMatch(/provisionBridgeToken\(supabase\)\.then\(\(r\) => \{ if \(live\) setBridgeProvision\(r\); \}\)/);
    expect(STUDIO).toMatch(/bridgeProvision,\n\s*\}\), \[[^\]]*bridgeProvision\]\);/);
  });
});

describe('provisionBridgeToken, the path the read now walks', () => {
  beforeEach(() => { try { localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY); } catch { /* node env */ } });

  it('stores the key the family RPC returns and reports it as provisioned', async () => {
    const client = { rpc: vi.fn(async () => ({ data: 'fam-key-123', error: null })) };
    expect(await provisionBridgeToken(client)).toBe('provisioned');
    expect(client.rpc).toHaveBeenCalledWith('get_family_bridge_token');
    expect(localStorage.getItem(CHAT_BRIDGE_TOKEN_KEY)).toBe('fam-key-123');
  });

  it('a device that already holds the key is not asked again', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'already');
    const client = { rpc: vi.fn() };
    expect(await provisionBridgeToken(client)).toBe('present');
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('a non-family or signed-out device gets none, and nothing is stored', async () => {
    const client = { rpc: vi.fn(async () => ({ data: null, error: null })) };
    expect(await provisionBridgeToken(client)).toBe('none');
    expect(localStorage.getItem(CHAT_BRIDGE_TOKEN_KEY)).toBeNull();
    expect(await provisionBridgeToken(null)).toBe('none');
  });
});

describe('the row says what came back, and names the one human step only when it is real', () => {
  it('the device already had the key', () => {
    const r = row({ bridgeKey: true, bridgeProvision: 'present' });
    expect(r.state).toBe(PASS);
    expect(r.fix).toBe('');
  });

  it('the device fetched the key just now — and says so', () => {
    const r = row({ bridgeKey: true, bridgeProvision: 'provisioned' });
    expect(r.state).toBe(PASS);
    expect(r.detail).toMatch(/received it just now/);
  });

  it('signed out: the fix is to sign in, because a signed-in device asks for itself', () => {
    const r = row({ signedIn: false, bridgeKey: false, bridgeProvision: 'unknown' });
    expect(r.state).toBe(FAIL);
    expect(r.fix).toMatch(/^Sign in\./);
    expect(r.fix).toMatch(/asks the family for the key itself/);
  });

  it('signed in and the family returned none: the ONE human step is named, and only here', () => {
    const r = row({ bridgeKey: false, bridgeProvision: 'none' });
    expect(r.state).toBe(FAIL);
    expect(r.fix).toMatch(/got none/);
    expect(r.fix).toMatch(/published it yet/);
    expect(r.fix).toMatch(/Real Estate → Photos/);
    expect(r.fix).toMatch(/not a member of a family space/);
  });

  it('signed in and not yet answered: no chore is assigned', () => {
    const r = row({ bridgeKey: false, bridgeProvision: 'unknown' });
    expect(r.fix).toMatch(/asks the family for the key itself the moment you open the studio/);
    expect(r.fix).not.toMatch(/Provision this device/);
  });

  it('the old chore is gone from the row entirely', () => {
    for (const p of ['present', 'provisioned', 'none', 'unknown']) {
      for (const k of [true, false]) {
        expect(row({ bridgeKey: k, bridgeProvision: p }).fix).not.toMatch(/Provision this device/);
      }
    }
  });

  it('the row points at the RPC that does the work', () => {
    expect(row({ bridgeKey: false, bridgeProvision: 'none' }).where).toMatch(/get_family_bridge_token, migration 0128/);
  });
});
