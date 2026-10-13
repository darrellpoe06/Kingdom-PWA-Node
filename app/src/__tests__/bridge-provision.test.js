// bridge-provision — the token provisions itself; the paste gate stays honest
// for everyone else (DR-0268). Proven-to-catch: each test fires the failure
// class it exists to stop — a device that re-asks a signed-in steward, a
// provision that clobbers an existing device token, a publish that invents
// success, a network error that becomes an error wall.
import { describe, it, expect, beforeEach } from 'vitest';
import { provisionBridgeToken, publishBridgeToken } from '../lib/bridge-provision.js';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';

const clientWith = (impl) => ({ rpc: impl });

beforeEach(() => localStorage.clear());

describe('provisionBridgeToken', () => {
  it('provisions a bare signed-in device from the RPC and stores the token', async () => {
    const client = clientWith(async (fn) => {
      expect(fn).toBe('get_family_bridge_token');
      return { data: '  tok-abc123  ', error: null };
    });
    expect(await provisionBridgeToken(client)).toBe('provisioned');
    expect(localStorage.getItem(CHAT_BRIDGE_TOKEN_KEY)).toBe('tok-abc123');
  });
  it('NEVER overwrites a token the device already has (no RPC call at all)', async () => {
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'existing');
    let called = 0;
    const client = clientWith(async () => { called += 1; return { data: 'other', error: null }; });
    expect(await provisionBridgeToken(client)).toBe('present');
    expect(called).toBe(0);
    expect(localStorage.getItem(CHAT_BRIDGE_TOKEN_KEY)).toBe('existing');
  });
  it('signed-out / no-row / RPC-error all land on none — the paste gate stays', async () => {
    expect(await provisionBridgeToken(clientWith(async () => ({ data: null, error: null })))).toBe('none');
    expect(await provisionBridgeToken(clientWith(async () => ({ data: '', error: null })))).toBe('none');
    expect(await provisionBridgeToken(clientWith(async () => ({ data: null, error: { message: 'x' } })))).toBe('none');
    expect(await provisionBridgeToken(null)).toBe('none');
    expect(localStorage.getItem(CHAT_BRIDGE_TOKEN_KEY)).toBe(null);
  });
  it('a rejecting client never throws out of the fail-quiet contract', async () => {
    expect(await provisionBridgeToken(clientWith(async () => { throw new Error('offline'); }))).toBe('none');
  });
});

describe('publishBridgeToken', () => {
  it('publishes a trimmed token and reports the RPC verdict truthfully', async () => {
    const calls = [];
    const client = clientWith(async (fn, args) => { calls.push([fn, args]); return { data: true, error: null }; });
    expect(await publishBridgeToken(client, '  tok-xyz  ')).toBe(true);
    expect(calls).toEqual([['set_family_bridge_token', { p_token: 'tok-xyz' }]]);
  });
  it('an empty paste, a server false, an error, or a throw all report false', async () => {
    expect(await publishBridgeToken(clientWith(async () => ({ data: true, error: null })), '   ')).toBe(false);
    expect(await publishBridgeToken(clientWith(async () => ({ data: false, error: null })), 'tok')).toBe(false);
    expect(await publishBridgeToken(clientWith(async () => ({ data: null, error: { message: 'denied' } })), 'tok')).toBe(false);
    expect(await publishBridgeToken(clientWith(async () => { throw new Error('offline'); }), 'tok')).toBe(false);
    expect(await publishBridgeToken(null, 'tok')).toBe(false);
  });
});
