// FamilyRoster (DR-0091) — the household roster on the 0055/0057 safety rails.
// Proven-to-catch (DR-0076): the pure rules are pinned (slugging, tier + UUID
// validation), the REAL card is mounted in jsdom against injected IO — the
// happy path, the guardian-refused path, and the migration-missing path each
// render their honest state — and the bright line is a guard: this surface
// never imports the family email allowlist, and the RPC name stays in parity
// with the real migration, so the safe door and the dangerous door can never
// be silently swapped.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { personaSlug, validateProvision, rosterRowShape } from '../lib/family-roster.js';
import FamilyRoster from '../components/FamilyRoster.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(SRC, '..', '..');

beforeEach(() => { document.body.innerHTML = ''; });

// --- pure rules ---------------------------------------------------------------

describe('personaSlug — the stable member key', () => {
  it('lowercases and joins alphanumeric runs', () => {
    expect(personaSlug('Christian')).toBe('christian');
    expect(personaSlug('Christyn  Poe')).toBe('christyn-poe');
    expect(personaSlug('  !!  ')).toBe('');
  });
});

describe('validateProvision — nothing malformed reaches the RPC', () => {
  it('requires a name, a real tier, and a well-formed optional UUID', () => {
    expect(validateProvision({ displayName: '', minorTier: 'teen' }).ok).toBe(false);
    expect(validateProvision({ displayName: 'Kid', minorTier: 'grown-up' }).ok).toBe(false);
    expect(validateProvision({ displayName: 'Kid', minorTier: 'teen', childUserId: 'not-a-uuid' }).ok).toBe(false);
    const good = validateProvision({ displayName: ' Christian ', minorTier: 'under13', childUserId: '' });
    expect(good.ok).toBe(true);
    expect(good.value).toEqual({ displayName: 'Christian', persona: 'christian', minorTier: 'under13', childUserId: null });
  });
  it('accepts a real account UUID and a custom persona', () => {
    const v = validateProvision({ displayName: 'Christiana', persona: 'Ana', minorTier: 'teen', childUserId: '123e4567-e89b-42d3-a456-426614174000' });
    expect(v.ok).toBe(true);
    expect(v.value.persona).toBe('ana');
    expect(v.value.childUserId).toBe('123e4567-e89b-42d3-a456-426614174000');
  });
});

describe('rosterRowShape — null-safe row shaping', () => {
  it('shapes a real row and derives the tier labels', () => {
    const r = rosterRowShape({ member_persona: 'christian', display_name: 'Christian', minor_tier: 'under13', coppa_protected: true, member_user_id: null });
    expect(r).toMatchObject({ persona: 'christian', tierLabel: 'Under 13', coppaProtected: true, linked: false });
  });
  it('an unknown tier degrades to adult, a null row never throws', () => {
    expect(rosterRowShape({ minor_tier: 'toddler' }).minorTier).toBe('adult');
    expect(() => rosterRowShape(null)).not.toThrow();
  });
});

// --- the mounted card (real component, injected IO) ---------------------------

async function mount(io) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(FamilyRoster, { io })); });
  return container;
}

// Set a React-controlled input's value through the native setter so React's
// onChange sees it (the standard jsdom technique for React 18 controlled forms).
async function type(el, value) {
  await act(async () => {
    const proto = el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}
async function submit(container) {
  await act(async () => {
    container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}
const nameInput = (c) => c.querySelector('input[placeholder="e.g. Christian"]');

describe('FamilyRoster card — real mount, injected IO', () => {
  it('renders the live roster rows with tier + link state', async () => {
    const io = {
      loadRoster: async () => ({ ok: true, data: [
        { member_persona: 'christian', display_name: 'Christian', minor_tier: 'under13', coppa_protected: true, member_user_id: null },
        { member_persona: 'christyn', display_name: 'Christyn', minor_tier: 'teen', coppa_protected: false, member_user_id: 'abc' },
      ] }),
      provision: async () => ({ ok: true, data: 'id' }),
    };
    const c = await mount(io);
    expect(c.innerHTML).toContain('Christian');
    expect(c.innerHTML).toContain('COPPA-protected');
    expect(c.innerHTML).toContain('no sign-in account linked yet');
    expect(c.innerHTML).toContain('account linked');
  });

  it('renders the honest empty state (real table, no placeholder)', async () => {
    const c = await mount({ loadRoster: async () => ({ ok: true, data: [] }), provision: async () => ({ ok: true }) });
    expect(c.innerHTML).toContain('No family members on the roster yet');
  });

  it('provisions through the RPC on submit and confirms with the tier label', async () => {
    const calls = [];
    const io = {
      loadRoster: async () => ({ ok: true, data: [] }),
      provision: async (v) => { calls.push(v); return { ok: true, data: 'new-id' }; },
    };
    const c = await mount(io);
    await type(nameInput(c), 'Christian');
    await submit(c);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ displayName: 'Christian', persona: 'christian', minorTier: 'under13', childUserId: null });
    expect(c.innerHTML).toContain('Christian is on the roster (Under 13)');
  });

  it('a non-guardian is refused with the honest reason (RLS wall, surfaced)', async () => {
    const io = {
      loadRoster: async () => ({ ok: true, data: [] }),
      provision: async () => ({ ok: false, error: 'only a guardian (owner/admin) may provision a child' }),
    };
    const c = await mount(io);
    await type(nameInput(c), 'Kid');
    await submit(c);
    expect(c.innerHTML).toContain('Only a guardian (owner/admin) can add a family member');
  });

  it('a missing migration is named, pointing at the migration ledger (never a silent no-op)', async () => {
    const io = {
      loadRoster: async () => ({ ok: true, data: [] }),
      provision: async () => ({ ok: false, error: 'function public.provision_child_member does not exist' }),
    };
    const c = await mount(io);
    await type(nameInput(c), 'Kid');
    await submit(c);
    expect(c.innerHTML).toContain('migration (0057) is not applied');
  });

  it('client validation stops a bad UUID before the RPC is ever called', async () => {
    const calls = [];
    const io = { loadRoster: async () => ({ ok: true, data: [] }), provision: async (v) => { calls.push(v); return { ok: true }; } };
    const c = await mount(io);
    await type(nameInput(c), 'Kid');
    await type(c.querySelector('input[style*="JetBrains"]'), 'not-a-uuid');
    await submit(c);
    expect(calls).toHaveLength(0);
    expect(c.innerHTML).toContain('account UUID');
  });
});

// --- the bright line + seam parity (cross-file guards) -------------------------

describe('the safe door stays the only door', () => {
  it('FamilyRoster never touches the family email allowlist (the dangerous flag)', () => {
    const src = readFileSync(join(SRC, 'components/FamilyRoster.jsx'), 'utf8');
    // Code usage, not prose: the header comment NAMES the flag to explain the
    // bright line; what must never appear is an import of it or a call to it.
    expect(src).not.toMatch(/import[^\n]*isFamilyEmail/);
    expect(src).not.toMatch(/isFamilyEmail\s*\(/);
    expect(src).not.toMatch(/FAMILY_EMAIL_PROFILES/);
  });
  it('the sync layer calls the exact RPC the migration defines (seam parity)', () => {
    const sync = readFileSync(join(SRC, 'lib/family-messaging-sync.js'), 'utf8');
    const mig = readFileSync(join(REPO, 'infra/supabase/migrations-auto/0057-family-messaging-and-minor-tiers.sql'), 'utf8');
    expect(sync).toContain("supabase.rpc('provision_child_member'");
    expect(mig).toContain('CREATE OR REPLACE FUNCTION public.provision_child_member(');
    expect(mig).toContain("user_role_in_instance(p_instance) NOT IN ('owner','admin')"); // guardian wall
    expect(mig).toContain("GENERATED ALWAYS AS (minor_tier = 'under13') STORED");        // COPPA derived
  });
  it('the roster is mounted in the steward seat (Serve faculty)', () => {
    const center = readFileSync(join(SRC, 'components/CommandServeCenter.jsx'), 'utf8');
    expect(center).toContain("import FamilyRoster from './FamilyRoster.jsx'");
    expect(center).toContain('<FamilyRoster />');
  });
});
