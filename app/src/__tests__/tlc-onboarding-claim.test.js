// myPacketStatus: no packet bound to this login -> the invite for the signed-in
// email starts one (0197). The seam is the only thing under test; supabase is
// a fake that records what was asked.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = [];
let packets = [];
let claim = null;
vi.mock('../lib/supabase.js', async (orig) => {
  const real = await orig();
  const chain = (rows) => {
    const q = {
      select: () => q, eq: () => q, order: () => q,
      limit: async () => ({ data: rows, error: null }),
    };
    return q;
  };
  const fake = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }), getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: (table) => { calls.push(['from', table]); return chain(packets); },
    rpc: async (name, args) => { calls.push([name, args]); return name === 'tlc_onboarding_claim' ? { data: claim, error: null } : { data: { id: 'inv1', token: 't', email: args && args.email_in, prefilled: !!(args && args.prefill_in) }, error: null }; },
  };
  return { ...real, default: fake, supabase: fake, onAuthChange: () => () => {} };
});

beforeEach(() => { calls.length = 0; packets = []; claim = null; });

describe('the colleague signs in and their packet is there', () => {
  it('a bound packet is read first and nothing is claimed', async () => {
    packets = [{ id: 'p1', status: 'draft', reviewed_at: null, submitted_at: null }];
    const { myPacketStatus } = await import('../lib/tlc-onboarding-sync.js');
    const res = await myPacketStatus();
    expect(res).toEqual({ packetId: 'p1', status: 'draft', reviewedAt: null, submittedAt: null });
    expect(calls.some((c) => c[0] === 'tlc_onboarding_claim')).toBe(false);
  });
  it('no packet yet: the claim by email starts one from the office’s prefilled invite and the status says so', async () => {
    claim = { packet_id: 'p9', status: 'draft', reviewed_at: null, submitted_at: null, claimed: true, packet: { firstName: 'Cora' } };
    const { myPacketStatus } = await import('../lib/tlc-onboarding-sync.js');
    const res = await myPacketStatus();
    expect(res).toEqual({ packetId: 'p9', status: 'draft', reviewedAt: null, submittedAt: null, claimed: true });
    expect(calls.some((c) => c[0] === 'tlc_onboarding_claim')).toBe(true);
  });
  it('no packet and no invite: null, as before', async () => {
    const { myPacketStatus } = await import('../lib/tlc-onboarding-sync.js');
    expect(await myPacketStatus()).toBeNull();
  });
  it('the office mints a prefilled invite through its own function, the email lowercased, the banking apart', async () => {
    const { mintPrefilledInvite } = await import('../lib/tlc-onboarding-sync.js');
    const res = await mintPrefilledInvite(' Cora@Example.com ', 'from the old form', { firstName: 'Cora' }, { bankName: 'B', routingNumber: '071000013', accountNumber: '1', accountType: 'checking' }, 'hiring form responses');
    expect(res.ok).toBe(true);
    const call = calls.find((c) => c[0] === 'tlc_onboarding_invite_prefilled');
    expect(call[1]).toEqual({ email_in: 'cora@example.com', note_in: 'from the old form', prefill_in: { firstName: 'Cora' }, banking_in: { bankName: 'B', routingNumber: '071000013', accountNumber: '1', accountType: 'checking' }, source_in: 'hiring form responses' });
  });
});
