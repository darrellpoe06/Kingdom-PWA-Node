// =============================================================================
// resolveUserName — one place decides the name a person shows as (DP 2026-07-12)
// =============================================================================
// "Everyone calls me DP... I want a user name so people can pick whatever they
// want... so people recognize who is who." The family thread was showing the
// email local part ("darrellpoe06"). PROVEN-TO-CATCH: a chosen display_name must
// win over name/full_name/email, and we must NEVER show the raw email local part
// when a real chosen/given name exists. Order: display_name → name → full_name →
// email local part → 'Member'.
import { describe, it, expect } from 'vitest';
import { resolveUserName } from '../lib/supabase.js';

describe('resolveUserName — the chosen name wins, email is the last resort', () => {
  it('prefers the CHOSEN display_name over everything', () => {
    expect(resolveUserName({
      email: 'darrellpoe06@gmail.com',
      user_metadata: { display_name: 'DP', name: 'Darrell Poe', full_name: 'Darrell Poe' },
    })).toBe('DP');
  });

  it('falls back to the signup name / full_name when no chosen name', () => {
    expect(resolveUserName({ email: 'x@y.com', user_metadata: { name: 'Sister Mary' } })).toBe('Sister Mary');
    expect(resolveUserName({ email: 'x@y.com', user_metadata: { full_name: 'Deacon Wright' } })).toBe('Deacon Wright');
  });

  it('only uses the email local part when there is no real name', () => {
    expect(resolveUserName({ email: 'darrellpoe06@gmail.com', user_metadata: {} })).toBe('darrellpoe06');
    expect(resolveUserName({ email: 'darrellpoe06@gmail.com' })).toBe('darrellpoe06');
  });

  it('never shows the whole email, and never blank — worst case is "Member"', () => {
    expect(resolveUserName(null)).toBe('Member');
    expect(resolveUserName({ user_metadata: {} })).toBe('Member');
    // whitespace-only chosen name is not a name — it falls through
    expect(resolveUserName({ email: 'a@b.com', user_metadata: { display_name: '   ' } })).toBe('a');
  });
});
