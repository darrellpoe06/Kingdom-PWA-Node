// =============================================================================
// Public registration — XSS / injection CLOSED-LOOP (the conference attack surface)
// =============================================================================
// Proves the full loop for the #1 attack surface (the open ?register=1 form):
//   1. A hostile <script> / <img onerror> payload submitted as a registration is
//      NEUTRALIZED before it is stored — the persisted row carries inert text, no
//      tag structure (defense-in-depth at the data layer, lib/sanitize-input).
//   2. Even an UN-sanitized value renders INERT through React — no <script> element
//      is ever created in the DOM (the primary render-time defense).
//   3. The no-leak contract still holds: an anonymous viewer cannot read the roll.
//   4. A normal registration still persists end-to-end (we did not break the flow).
// Network-free: a faithful in-memory model of the table under its RLS (same approach
// as conference-register-closed-loop.test.js). DR-0076: prove it, don't claim it.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const h = vi.hoisted(() => ({ state: { store: [], role: 'organizer' } }));

vi.mock('../lib/supabase.js', () => {
  const order = () => Promise.resolve({
    data: h.state.role === 'organizer' ? [...h.state.store].slice().reverse() : [],
    error: null,
  });
  const from = () => ({
    insert: (row) => {
      const rows = Array.isArray(row) ? row : [row];
      rows.forEach((r) => h.state.store.push({ id: `id-${h.state.store.length + 1}`, instance_id: 'colg-instance', created_at: '2026-06-17T00:00:00Z', ...r }));
      return Promise.resolve({ error: null });
    },
    select: function select() { return this; },
    order,
  });
  const supabase = { from, channel: () => ({ on: () => ({ subscribe: () => ({}) }) }), removeChannel: () => {} };
  return { default: supabase, supabase };
});

import { submitRegistration, fetchRegistrations } from '../lib/conference-register.js';

beforeEach(() => { h.state.store = []; h.state.role = 'organizer'; });

describe('XSS payload in a registration is neutralized before storage', () => {
  it('strips a <script> tag from the name — the stored row is inert text', async () => {
    const res = await submitRegistration({ name: '<script>alert(1)</script>Naomi', mealType: 'Regular' });
    expect(res.ok).toBe(true);
    const stored = h.state.store[0];
    expect(stored.name).toBe('alert(1)Naomi');
    expect(stored.name).not.toMatch(/<script/i);
  });

  it('strips an <img onerror> payload from a free-text field (dietary)', async () => {
    await submitRegistration({ name: 'Adam', dietary: '<img src=x onerror=alert(1)> nut allergy' });
    const stored = h.state.store[0];
    expect(stored.dietary).not.toMatch(/<img|onerror=/i);
    expect(stored.dietary).toContain('nut allergy');
  });

  it('removes invisible / bidi smuggling characters from the name', async () => {
    const bidi = String.fromCharCode(0x202E); // right-to-left override
    const zwsp = String.fromCharCode(0x200B); // zero-width space
    await submitRegistration({ name: 'Na' + zwsp + 'omi' + bidi });
    expect(h.state.store[0].name).toBe('Naomi');
  });
});

describe('React renders even an UN-sanitized value INERT (no live <script>)', () => {
  it('a raw <script> string becomes text, never a script element', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    // Deliberately render an UNSANITIZED hostile string to prove the RENDER path
    // (React escaping) is itself safe — belt and suspenders with the data cleaning.
    await act(async () => { root.render(createElement('div', null, '<script>alert(1)</script>')); });
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toBe('<script>alert(1)</script>'); // shown as literal text
    await act(async () => { root.unmount(); });
    container.remove();
  });
});

describe('no-leak + happy-path still hold after hardening', () => {
  it('an anonymous viewer still cannot read the roll back', async () => {
    await submitRegistration({ name: 'Naomi' });
    h.state.role = 'anon';
    const { ok, rows } = await fetchRegistrations();
    expect(ok).toBe(true);
    expect(rows).toEqual([]);
  });

  it('a normal registration still persists and the organizer sees it', async () => {
    const res = await submitRegistration({ name: 'Naomi Poe', mealType: 'Vegan', dietary: 'peanut', partySize: '2' });
    expect(res.ok).toBe(true);
    h.state.role = 'organizer';
    const { rows } = await fetchRegistrations();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'Naomi Poe', mealType: 'Vegan', dietary: 'peanut', partySize: 2 });
  });
});
