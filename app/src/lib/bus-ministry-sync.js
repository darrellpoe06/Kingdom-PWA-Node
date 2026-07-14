// =============================================================================
// bus-ministry-sync — Supabase-backed Bus/Van Ministry (roster + routes + vans +
// schedule + reminders + messages + dev/ops requests).
// =============================================================================
// Mirrors choir-sync.js: writeContext() resolves the church tenant before any
// write (so RLS passes), and a postgres_changes realtime stream keeps the
// ministry's devices live. Backed by the bus_* tables from
// infra/supabase/migrations-auto/0095-bus-ministry.sql. Writes fail soft and
// surface { skipped } to the caller; RLS is the real enforcement.
//
// Pure logic (shapes, coverage, reminder plan, date math) lives in
// lib/bus-ministry.js and is re-exported here for the surface's convenience.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { inviteToChurch, isValidInviteEmail } from './choir-sync.js';
import {
  toDriverShape, toRouteShape, toVanShape, toScheduleShape, toReminderShape, toBusMessageShape, toRequestShape,
  toRideRequestShape,
  deriveAccess, buildReminderPlan,
  STARTER_ROUTES, STARTER_VANS, DEFAULT_ARRIVE, DEFAULT_END,
} from './bus-ministry.js';

export * from './bus-ministry.js';
export { inviteToChurch, isValidInviteEmail };

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
function resolveDisplayName(session, explicit) {
  const trimmed = (explicit || '').trim();
  if (trimmed) return trimmed;
  return session?.user?.email?.split('@')[0] || 'Driver';
}
async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id, displayName: resolveDisplayName(session, displayName) };
}

// --- Access ------------------------------------------------------------------
export async function getBusAccess(displayName) {
  const session = await currentSession();
  if (!session) return { signedIn: false, canSee: false, canEdit: false, tenantId: null, role: null };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { signedIn: true, canSee: false, canEdit: false, tenantId: null, role: null };
  const [{ data: role }, { data: inMinistry }] = await Promise.all([
    supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId }),
    supabase.rpc('user_in_bus_ministry', { instance_uuid: tenantId }),
  ]);
  const { canEdit, canSee } = deriveAccess(role, inMinistry);
  return { signedIn: true, canSee, canEdit, tenantId, role: role ?? null };
}

// --- Generic realtime subscriber (mirror choir-sync.makeSubscriber) ----------
function makeSubscriber(table, mapRow, orderBy) {
  return function subscribe(onChange) {
    let channel = null;
    let cancelled = false;
    (async () => {
      const session = await currentSession();
      if (!session || cancelled) return;
      const myUserId = session.user.id;
      const fetchAll = async () => {
        const q = supabase.from(table).select('*');
        const { data, error } = orderBy ? await q.order(orderBy.col, { ascending: orderBy.asc }) : await q;
        if (error) { console.warn(`[bus-sync] ${table} fetch failed:`, error); return null; }
        return (data || []).map((r) => mapRow(r, myUserId));
      };
      const initial = await fetchAll();
      if (initial && !cancelled) onChange(initial);
      channel = supabase
        .channel(`${table}-stream`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
        })
        .subscribe();
    })();
    return function unsubscribe() {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  };
}

export const subscribeDrivers     = makeSubscriber('bus_drivers', toDriverShape, { col: 'created_at', asc: true });
export const subscribeRoutes      = makeSubscriber('bus_routes', toRouteShape, { col: 'sort_order', asc: true });
export const subscribeVans        = makeSubscriber('bus_vans', toVanShape, { col: 'created_at', asc: true });
export const subscribeSchedule    = makeSubscriber('bus_schedule', toScheduleShape, { col: 'service_date', asc: true });
export const subscribeReminders   = makeSubscriber('bus_reminders', toReminderShape, { col: 'send_on', asc: true });
export const subscribeBusMessages = makeSubscriber('bus_messages', toBusMessageShape, { col: 'created_at', asc: true });
export const subscribeRequests    = makeSubscriber('bus_requests', toRequestShape, { col: 'created_at', asc: false });
export const subscribeRideRequests = makeSubscriber('bus_ride_requests', toRideRequestShape, { col: 'created_at', asc: false });

// --- Roster ------------------------------------------------------------------
export async function saveDriver(driver, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    user_id: driver.userId ?? null,
    display_name: driver.displayName ?? '',
    phone: driver.phone ?? null,
    email: driver.email ?? null,
    driver_role: driver.role ?? 'driver',
    notes: driver.notes ?? null,
    active: driver.active !== false,
  };
  if (driver.id) {
    const { error } = await supabase.from('bus_drivers').update(row).eq('id', driver.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('bus_drivers').insert({ ...row, instance_id: ctx.tenantId, added_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}
export async function removeDriver(id) {
  const { error } = await supabase.from('bus_drivers').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// --- Routes ------------------------------------------------------------------
export async function saveRoute(route, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    name: route.name ?? '',
    area: route.area ?? null,
    description: route.description ?? null,
    accessible: route.accessible === true,
    sort_order: Number.isFinite(route.sortOrder) ? route.sortOrder : 0,
    active: route.active !== false,
  };
  if (route.id) {
    const { error } = await supabase.from('bus_routes').update({ ...row, updated_by: ctx.userId }).eq('id', route.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('bus_routes').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}
export async function removeRoute(id) {
  const { error } = await supabase.from('bus_routes').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
export async function addStarterRoutes(displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const rows = STARTER_ROUTES.map((r) => ({ ...r, instance_id: ctx.tenantId, created_by: ctx.userId }));
  const { error } = await supabase.from('bus_routes').insert(rows);
  return error ? { skipped: 'insert-error', error } : { saved: rows.length };
}

// --- Vans --------------------------------------------------------------------
export async function saveVan(van, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    name: van.name ?? '',
    capacity: Number.isFinite(van.capacity) ? van.capacity : null,
    accessible: van.accessible === true,
    notes: van.notes ?? null,
    active: van.active !== false,
  };
  if (van.id) {
    const { error } = await supabase.from('bus_vans').update({ ...row, updated_by: ctx.userId }).eq('id', van.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('bus_vans').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}
export async function removeVan(id) {
  const { error } = await supabase.from('bus_vans').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
export async function addStarterVans(displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const rows = STARTER_VANS.map((v) => ({ ...v, instance_id: ctx.tenantId, created_by: ctx.userId }));
  const { error } = await supabase.from('bus_vans').insert(rows);
  return error ? { skipped: 'insert-error', error } : { saved: rows.length };
}

// --- Schedule ----------------------------------------------------------------
export async function saveScheduleRow(item, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {
    service_date: item.serviceDate,
    route_id: item.routeId ?? null,
    route_name: item.routeName ?? null,
    van_id: item.vanId ?? null,
    van_name: item.vanName ?? null,
    driver_id: item.driverId ?? null,
    driver_user_id: item.driverUserId ?? null,
    driver_name: item.driverName ?? null,
    arrive_time: item.arriveTime || DEFAULT_ARRIVE,
    end_time: item.endTime || DEFAULT_END,
    status: item.status ?? (item.driverName ? 'scheduled' : 'open'),
    notes: item.notes ?? null,
  };
  if (item.id) {
    const { error } = await supabase.from('bus_schedule').update({ ...row, updated_by: ctx.userId }).eq('id', item.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }
  const { error } = await supabase.from('bus_schedule').insert({ ...row, instance_id: ctx.tenantId, created_by: ctx.userId });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}
export async function removeScheduleRow(id) {
  const { error } = await supabase.from('bus_schedule').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
// A driver confirms/declines their OWN assignment (RLS allows the self-update).
export async function setScheduleStatus(id, status) {
  const { error } = await supabase.from('bus_schedule').update({ status }).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

// --- Reminders ---------------------------------------------------------------
// "The schedule is out -> reminders go out." Build a plan from the assigned rows
// for a date and insert the pending reminders (idempotency is the coordinator's:
// this is an explicit action, mirroring how the sister used to make the calls).
export async function scheduleReminders(scheduleRows, opts, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const plan = buildReminderPlan(scheduleRows, opts || {});
  if (!plan.length) return { saved: 0 };
  const rows = plan.map((p) => ({
    instance_id: ctx.tenantId,
    service_date: p.serviceDate,
    schedule_id: p.scheduleId,
    driver_id: p.driverId,
    driver_user_id: p.driverUserId,
    driver_name: p.driverName,
    route_name: p.routeName,
    send_on: p.sendOn,
    channel: p.channel,
    status: 'pending',
    created_by: ctx.userId,
  }));
  const { error } = await supabase.from('bus_reminders').insert(rows);
  return error ? { skipped: 'insert-error', error } : { saved: rows.length };
}
export async function markReminderSent(id, note) {
  const { data: sess } = await supabase.auth.getSession();
  const patch = { status: 'sent', sent_at: new Date().toISOString(), sent_by: sess?.session?.user?.id ?? null };
  if (note != null) patch.note = note;
  const { error } = await supabase.from('bus_reminders').update(patch).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}
export async function acknowledgeReminder(id) {
  const { error } = await supabase.from('bus_reminders').update({ status: 'acknowledged' }).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}
export async function removeReminder(id) {
  const { error } = await supabase.from('bus_reminders').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// --- Messages ----------------------------------------------------------------
export async function sendBusMessage(body, displayName) {
  const text = (body || '').trim();
  if (!text) return { skipped: 'empty' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('bus_messages').insert({
    instance_id: ctx.tenantId, user_id: ctx.userId, display_name: ctx.displayName, body: text,
  });
  return error ? { skipped: 'insert-error', error } : { sent: true };
}

// --- Dev/Ops requests --------------------------------------------------------
export async function submitRequest(request, displayName) {
  const text = (request.title || '').trim();
  if (!text) return { skipped: 'empty' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('bus_requests').insert({
    instance_id: ctx.tenantId,
    title: text,
    detail: request.detail ?? null,
    submitted_by: ctx.userId,
    submitter_name: ctx.displayName,
    priority: request.priority ?? 'normal',
    status: 'new',
    created_by: ctx.userId,
  });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}
export async function updateRequest(id, patch, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = {};
  if (patch.status != null) row.status = patch.status;
  if (patch.priority != null) row.priority = patch.priority;
  if (patch.resolution != null) row.resolution = patch.resolution;
  row.updated_by = ctx.userId;
  const { error } = await supabase.from('bus_requests').update(row).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

// --- Ride requests (a rider asks for a pickup; the coordinator acts) ----------
// Any signed-in church member can file one (RLS: user_in_instance + own id).
// Fails soft; the client shows the reason. `form` is the rider-facing shape.
export async function submitRideRequest(form, displayName) {
  const name = (form?.riderName || '').trim();
  const area = (form?.pickupArea || '').trim();
  const address = (form?.pickupAddress || '').trim();
  if (!name || (!area && !address)) return { skipped: 'incomplete' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const passengers = Number(form.passengers);
  const { error } = await supabase.from('bus_ride_requests').insert({
    instance_id: ctx.tenantId,
    requested_by: ctx.userId,
    rider_name: name,
    rider_phone: (form.riderPhone || '').trim() || null,
    pickup_area: area || null,
    pickup_address: address || null,
    service_date: form.serviceDate || null,
    passengers: Number.isFinite(passengers) && passengers >= 1 ? Math.floor(passengers) : 1,
    accessible_needed: !!form.accessibleNeeded,
    notes: (form.notes || '').trim() || null,
    status: 'new',
    created_by: ctx.userId,
  });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

// The coordinator moves a request along (status / driver assignment / a note),
// or the rider cancels their own. RLS decides who may actually write.
export async function updateRideRequest(id, patch, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const row = { updated_by: ctx.userId };
  if (patch.status != null) row.status = patch.status;
  if (patch.assignedDriverId !== undefined) row.assigned_driver_id = patch.assignedDriverId;
  if (patch.assignedDriverName !== undefined) row.assigned_driver_name = patch.assignedDriverName;
  if (patch.coordinatorNote !== undefined) row.coordinator_note = patch.coordinatorNote;
  const { error } = await supabase.from('bus_ride_requests').update(row).eq('id', id);
  return error ? { skipped: 'update-error', error } : { saved: true };
}
