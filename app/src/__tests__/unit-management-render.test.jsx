// =============================================================================
// UnitManagement — live render proof (Verification Doctrine DR-0076: observe the
// REAL surface, not just the pure logic). Mounts the actual per-unit panel and
// drives it as a user would, proving: (1) it mounts without crashing, (2) the
// three management sections render, (3) a note added to a SPECIFIC unit is
// persisted against that door (the exact thing that was broken: "I can't add
// notes per unit"), and (4) signed-out, the relational workflows show an honest
// gated state instead of pretending to persist (no fake-green).
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import UnitManagement from '../components/UnitManagement.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
const clickEl = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); };
const byText = (re) => [...container.querySelectorAll('button, a')].find((b) => re.test((b.textContent || '').trim()));

async function typeInto(el, value) {
  await act(async () => {
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });

const UNIT = { id: 'r6', name: '240 Cedar Ln Apt 3', building: '240 Cedar Ln', unitLabel: 'Apt 3', unitNotes: [] };

describe('UnitManagement — mounts, renders the three sections, persists a per-unit note', () => {
  it('renders notes + gated relational workflows, and a saved note attaches to THIS door', async () => {
    const calls = [];
    const updateRental = (id, patch) => calls.push({ id, patch });

    container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      root = createRoot(container);
      root.render(createElement(UnitManagement, { rental: UNIT, updateRental }));
    });
    // let the signed-out session check settle
    await act(async () => { await Promise.resolve(); });

    const text = container.textContent || '';
    // (2) all three management sections are present.
    expect(text).toMatch(/Unit notes/);
    expect(text).toMatch(/Service requests/);
    expect(text).toMatch(/thread/i);
    // (4) signed-out => relational workflows show the honest gated state.
    expect(text).toMatch(/Sign in to run live/);

    // (3) add a note to this unit.
    await clickEl(byText(/\+ Add note/));
    const ta = container.querySelector('textarea');
    expect(ta, 'note textarea revealed').toBeTruthy();
    await typeInto(ta, 'Front porch handrail loose');
    await clickEl(byText(/Save note/));

    // The note was persisted against THIS door (rental_ref = r6), device-local,
    // so it survives reload — the fix for "I can't add notes per unit".
    expect(calls).toHaveLength(1);
    expect(calls[0].id).toBe('r6');
    const saved = calls[0].patch.unitNotes;
    expect(saved).toHaveLength(1);
    expect(saved[0].rental_ref).toBe('r6');
    expect(saved[0].unit_label).toBe('Apt 3');
    expect(saved[0].body).toBe('Front porch handrail loose');

    await act(async () => root.unmount());
    container.remove();
  });
});
