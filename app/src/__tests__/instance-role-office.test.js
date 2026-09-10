// The office role store (0193, DR-0351): the TLC door reads
// my_office_instance_role(); the shell keeps my_default_instance_role(); the
// office instance id comes from the office resolver and never joins anything.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = [];
let session = { user: { id: 'u1' } };
vi.mock('../lib/supabase.js', async (orig) => {
  const real = await orig();
  const fake = {
    auth: { getSession: async () => ({ data: { session } }) },
    rpc: async (name, args) => {
      calls.push([name, args]);
      if (name === 'my_office_instance_role') return { data: { instance_id: 'tlc-1', instance_slug: 'tlc-therapy-solutions', instance_type: 'therapy-practice', role: 'admin' }, error: null };
      if (name === 'my_default_instance_role') return { data: { instance_id: 'fam-1', instance_slug: 'poe-family', instance_type: 'family', role: 'owner' }, error: null };
      if (name === 'join_default_instance') return { data: 'fam-1', error: null };
      return { data: null, error: { message: `no such rpc ${name}` } };
    },
  };
  return { ...real, default: fake, supabase: fake, onAuthChange: () => () => {} };
});

beforeEach(() => { calls.length = 0; });

describe('two resolvers, one store shape', () => {
  it('the office store asks the office resolver and the default store the family-first one; the same person reads a different seat at each door', async () => {
    const { fetchOfficeInstanceRole, fetchInstanceRole, canManageTeam } = await import('../lib/instance-role.js');
    const office = await fetchOfficeInstanceRole();
    const home = await fetchInstanceRole();
    expect(office).toEqual({ instanceId: 'tlc-1', instanceSlug: 'tlc-therapy-solutions', instanceType: 'therapy-practice', role: 'admin', loaded: true });
    expect(home).toEqual({ instanceId: 'fam-1', instanceSlug: 'poe-family', instanceType: 'family', role: 'owner', loaded: true });
    expect(calls.map((c) => c[0]).sort()).toEqual(['my_default_instance_role', 'my_office_instance_role']);
    expect(canManageTeam(office)).toBe(true);
  });
  it('getOfficeInstanceId reads the office resolver only — it never joins or creates a space, and a person with no office gets null', async () => {
    const { getOfficeInstanceId } = await import('../lib/table-sync.js');
    expect(await getOfficeInstanceId()).toBe('tlc-1');
    expect(calls.map((c) => c[0])).toEqual(['my_office_instance_role']);
    expect(calls.some((c) => c[0] === 'join_default_instance')).toBe(false);
  });
});
