// @vitest-environment jsdom
// =============================================================================
// THE STAFF TALK APART FROM THE TENANT; THE TENANT IS TOLD WHERE THINGS ARE
// (DR-1598)
// =============================================================================
// Darrell, 2026-11-19: "Only in group chats... one with the tenants being able
// to see what's happening and another for sensitive information... so 1099
// and landlord can discuss and others who we want can be added etc..." and
// "tenants should only have access to message we send them and what and
// where certain things are like baseboard heating etc..."
// The walls are the database's (infra/supabase/tests/0338-...-smoke.sql);
// this pins the app half.
// =============================================================================
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  openStaffChat, loadStaffChat, sendStaffMessage, addStaffMember, removeStaffMember, loadWhereThingsAre,
  activeMembers, addableToStaffChat, staffName,
} from '../modules/properties/staff-chat.js';
import StaffChat from '../modules/properties/StaffChat.jsx';
import WhereThingsAre from '../modules/properties/WhereThingsAre.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const src = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');

const inv = (over = {}) => ({ id: 'i', instance_id: 'inst', role_label: 'field_worker', display_name: 'Coreyon', claimed_by: 'u-c', revoked: false, ...over });

describe('who can be added to the staff chat', () => {
  it('PROVEN-TO-CATCH: never someone who lives at the door, never an unsigned invite, never a tenant role', () => {
    const list = addableToStaffChat([
      inv(),
      inv({ id: 'i2', display_name: 'Isaiah Ramos', claimed_by: 'u-i' }),
      inv({ id: 'i3', display_name: 'Not yet', claimed_by: null }),
      inv({ id: 'i4', display_name: 'Tina', role_label: 'tenant', claimed_by: 'u-t' }),
      inv({ id: 'i5', display_name: 'Mel', role_label: 'manager', claimed_by: 'u-m' }),
      inv({ id: 'i6', display_name: 'Gone', claimed_by: 'u-g', revoked: true }),
      inv({ id: 'i7', display_name: 'Lives here', claimed_by: 'u-l' }),
      inv({ id: 'i8', display_name: 'Elsewhere', claimed_by: 'u-e', instance_id: 'other' }),
    ], [{ user_id: 'u-c', removed_at: null }], { instanceId: 'inst', livesHere: (u) => u === 'u-l' });
    expect(list.map((x) => x.name)).toEqual(['Isaiah Ramos', 'Mel']);
  });

  it('a removed member can be added again; the list keeps the removal', () => {
    const members = [{ user_id: 'u-c', removed_at: '2026-11-19T12:00:00Z' }];
    expect(activeMembers(members)).toEqual([]);
    expect(addableToStaffChat([inv()], members).map((x) => x.userId)).toEqual(['u-c']);
  });

  it('names come from the list or the invitation, never a guessed role', () => {
    expect(staffName('me', { me: 'me' })).toBe('You');
    expect(staffName('u-c', { members: [{ user_id: 'u-c', display_name: 'Coreyon' }] })).toBe('Coreyon');
    expect(staffName('u-x', { names: new Map([['u-x', 'Isaiah']]) })).toBe('Isaiah');
    expect(staffName('u-y')).toBe('Someone on the staff chat');
  });
});

describe('the reads and writes', () => {
  it('opens by the door through open_staff_chat and reads both lists', async () => {
    const rpc = vi.fn(async () => ({ data: 'chat-1', error: null }));
    expect(await openStaffChat('door-1', { rpc })).toEqual({ ok: true, chatId: 'chat-1' });
    expect(rpc).toHaveBeenCalledWith('open_staff_chat', { p_rental: 'door-1' });
    const q = (rows) => ({ select: () => ({ eq: () => ({ order: async () => ({ data: rows, error: null }) }) }) });
    const client = { from: (t) => q(t === 'property_staff_chat_members' ? [{ user_id: 'u' }] : [{ id: 'm', body: 'hi' }]) };
    expect(await loadStaffChat('chat-1', client)).toEqual({ ok: true, members: [{ user_id: 'u' }], messages: [{ id: 'm', body: 'hi' }] });
  });

  it('a tenant gets null back and the chat stays closed', async () => {
    expect(await openStaffChat('door-1', { rpc: async () => ({ data: null, error: null }) })).toEqual({ ok: true, chatId: null });
  });

  it('a failed read is a failure, not an empty chat', async () => {
    expect((await openStaffChat('d', { rpc: async () => ({ error: { message: 'function public.open_staff_chat(uuid) does not exist' } }) })).reason).toBe('not-enabled-yet');
    const bad = { from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: null, error: { message: 'x' } }) }) }) }) };
    expect((await loadStaffChat('c', bad)).reason).toBe('read-failed');
  });

  it('sends as me, refuses empty and over-long, and the add says why it was refused', async () => {
    const insert = vi.fn(async () => ({ error: null }));
    expect((await sendStaffMessage({ chatId: 'c', body: ' hi ', userId: 'me' }, { from: () => ({ insert }) })).ok).toBe(true);
    expect(insert).toHaveBeenCalledWith({ chat_id: 'c', sender_user_id: 'me', body: 'hi', instance_id: null });
    expect((await sendStaffMessage({ chatId: 'c', body: '  ', userId: 'me' }, { from: () => ({ insert }) })).reason).toBe('empty');
    expect((await sendStaffMessage({ chatId: 'c', body: 'x'.repeat(4001), userId: 'me' }, { from: () => ({ insert }) })).reason).toBe('too-long');
    expect(await addStaffMember({ chatId: 'c', userId: 'u-t' }, { rpc: async () => ({ data: 'lives-here', error: null }) })).toMatchObject({ ok: false, reason: 'lives-here' });
    expect((await addStaffMember({ chatId: 'c', userId: 'u' }, { rpc: async () => ({ data: 'added', error: null }) })).ok).toBe(true);
    expect((await removeStaffMember({ chatId: 'c', userId: 'u' }, { rpc: async () => ({ data: 'removed', error: null }) })).ok).toBe(true);
  });

  it('where things are reads the tenancy\'s shared systems', async () => {
    const rpc = vi.fn(async () => ({ data: [{ id: 's', name: 'Water shutoff', location_note: 'basement' }], error: null }));
    expect((await loadWhereThingsAre('t-1', { rpc })).things).toHaveLength(1);
    expect(rpc).toHaveBeenCalledWith('where_things_are', { p_tenancy: 't-1' });
  });
});

describe('the two chats on screen', () => {
  let container, root;
  afterEach(() => { try { act(() => root && root.unmount()); } catch { /* noop */ } if (container) container.remove(); });
  const mount = async (el) => {
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    await act(async () => { root.render(el); });
  };

  const api = (over = {}) => ({
    openStaffChat: async () => ({ ok: true, chatId: 'c1' }),
    loadStaffChat: async () => ({ ok: true, members: [{ id: 'm1', user_id: 'u-c', display_name: 'Coreyon', removed_at: null }], messages: [{ id: 'x', sender_user_id: 'u-c', body: 'Breaker is in the garage', sent_at: '2026-11-19T10:00:00Z' }] }),
    sendStaffMessage: vi.fn(async () => ({ ok: true })),
    addStaffMember: vi.fn(async () => ({ ok: true })),
    removeStaffMember: vi.fn(async () => ({ ok: true })),
    ...over,
  });

  it('PROVEN-TO-CATCH: the staff chat says, before anyone types, that the tenant never sees it', async () => {
    const a = api();
    await mount(createElement(StaffChat, { rentalId: 'door-1', me: 'owner', canRun: true, invites: [inv({ claimed_by: 'u-i', display_name: 'Isaiah Ramos' })], api: a }));
    const box = container.querySelector('[data-testid="staff-chat"]');
    expect(box.textContent).toContain('the tenant never sees this');
    expect(box.textContent).toContain('Breaker is in the garage');
    expect(box.textContent).toContain('Coreyon');
    const send = [...box.querySelectorAll('button')].find((b) => b.textContent === 'Send to staff only');
    expect(send).toBeTruthy();
    const ta = box.querySelector('textarea');
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(ta, 'Outlet is done');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { send.click(); });
    expect(a.sendStaffMessage).toHaveBeenCalledWith({ chatId: 'c1', body: 'Outlet is done', userId: 'owner' });
  });

  it('the landlord adds and removes people; a worker gets no such controls', async () => {
    const a = api();
    await mount(createElement(StaffChat, { rentalId: 'door-1', me: 'owner', canRun: true, invites: [inv({ claimed_by: 'u-i', display_name: 'Isaiah Ramos' })], api: a }));
    const sel = container.querySelector('select[aria-label="Add someone to the staff chat"]');
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, 'u-i');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => { [...container.querySelectorAll('button')].find((b) => b.textContent === 'Add').click(); });
    expect(a.addStaffMember).toHaveBeenCalledWith({ chatId: 'c1', userId: 'u-i', name: 'Isaiah Ramos' });
    await act(async () => { [...container.querySelectorAll('button')].find((b) => b.textContent === 'Remove').click(); });
    expect(a.removeStaffMember).toHaveBeenCalledWith({ chatId: 'c1', userId: 'u-c' });
    act(() => root.unmount()); container.remove();
    await mount(createElement(StaffChat, { rentalId: 'door-1', me: 'u-c', canRun: false, api: api() }));
    expect(container.querySelector('select[aria-label="Add someone to the staff chat"]')).toBeNull();
  });

  it('PROVEN-TO-CATCH: re-rendering does not re-open the chat (a fresh default object per render looped forever)', async () => {
    const src2 = src('modules', 'properties', 'StaffChat.jsx');
    expect(src2).toContain('api = STAFF_CHAT_API,');
    const a = api();
    a.openStaffChat = vi.fn(a.openStaffChat);
    await mount(createElement(StaffChat, { rentalId: 'door-1', me: 'owner', api: a }));
    await act(async () => { root.render(createElement(StaffChat, { rentalId: 'door-1', me: 'owner', api: a })); });
    expect(a.openStaffChat).toHaveBeenCalledTimes(1);
  });

  it('closed (a tenant, or no door) renders nothing at all', async () => {
    await mount(createElement(StaffChat, { rentalId: 'door-1', api: api({ openStaffChat: async () => ({ ok: true, chatId: null }) }) }));
    expect(container.querySelector('[data-testid="staff-chat"]')).toBeNull();
  });

  it('where things are: name and place, read-only; nothing shared shows nothing', async () => {
    await mount(createElement(WhereThingsAre, { tenancyId: 't', load: async () => ({ ok: true, things: [{ id: 's', name: 'Water shutoff', location_note: 'basement, north wall' }] }) }));
    expect(container.textContent).toContain('Water shutoff · basement, north wall');
    expect(container.querySelector('input,textarea,button')).toBeNull();
    act(() => root.unmount()); container.remove();
    await mount(createElement(WhereThingsAre, { tenancyId: 't', load: async () => ({ ok: true, things: [] }) }));
    expect(container.querySelector('[data-testid="where-things-are"]')).toBeNull();
  });
});

describe('the wiring', () => {
  const app = src('modules', 'properties', 'PropertiesApp.jsx');
  it('a tenant face never mounts the staff chat; staff see the tenant chat labelled as the tenant\'s', () => {
    expect(app).toMatch(/\{!tenantFace && <StaffChat rentalId=\{askDoorId\}/);
    expect(app).toContain("title={tenantFace ? 'Messages' : 'Tenant group chat · the tenant sees everything here'}");
  });
  it('the tenant\'s My place shows where things are', () => {
    expect(app).toMatch(/<WhereThingsAre tenancyId=\{activeDoor\.id\} \/>/);
  });
  it('the landlord marks a system shared, only once it says where it is', () => {
    const sys = src('modules', 'properties', 'SystemsTab.jsx');
    expect(sys).toContain('share_with_tenant: !r.system.share_with_tenant');
    expect(sys).toContain('disabled={busy || !r.system.location_note}');
  });
  it('the worker reaches the staff chat from each job', () => {
    expect(src('modules', 'properties', 'MyWorkOrders.jsx')).toContain('Talk with the landlord (staff only)');
  });
});
