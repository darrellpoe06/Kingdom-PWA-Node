// =============================================================================
// church-calendar-sync — the office's calendar rows, read for one church
// (DR-1585)
// =============================================================================
// The rows are ministry_ops (migration 0099) filed under the calendar
// ministry. SCOPE IS THE CHURCH INSTANCE, not the user: a church calendar is
// the church's shared record (USER-ACCOUNTS-AND-HISTORIES-STANDARD keeps a
// person's own history per user; this is not one). RLS is the tenancy gate
// (DR-0060): a signed-in member reads only their own church's member-visible
// rows, the office (owner/admin) reads all of theirs. The church is resolved
// the way every church surface resolves it (lib/church-instance.js) and the
// query names that instance as well, so a reader who belongs to two instances
// still sees one church's calendar.
//
// A read that could not be made is 'unavailable', never an empty calendar
// (DR-1053): the surface says which it is. Bounded by READ_TIMEOUT_MS.
// =============================================================================
import { useEffect, useState } from 'react';
import supabase from './supabase.js';
import { churchInstanceResolve } from './church-instance.js';
import { CALENDAR_MINISTRY } from './church-calendar.js';

export const READ_TIMEOUT_MS = 8000;

const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), ms));

/** { status: 'ok', rows } | { status: 'signed-out' | 'no-church' | 'unavailable', rows: [] }. Never throws. */
export async function readCalendarRows({ client = supabase, resolveChurch = churchInstanceResolve, timeoutMs = READ_TIMEOUT_MS } = {}) {
  const none = (status) => ({ status, rows: [] });
  try {
    const { data } = await client.auth.getSession();
    if (!data || !data.session) return none('signed-out');
    const church = await Promise.race([resolveChurch(), timeout(timeoutMs)]);
    if (!church || church.timedOut || !church.ok) return none('unavailable');
    if (!church.value) return none('no-church');
    const read = client
      .from('ministry_ops')
      .select('id, ministry, title, detail, week_of, member_visible')
      .eq('instance_id', church.value)
      .eq('ministry', CALENDAR_MINISTRY)
      .order('week_of', { ascending: true });
    const res = await Promise.race([read, timeout(timeoutMs)]);
    if (!res || res.timedOut || res.error) return none('unavailable');
    return { status: 'ok', rows: Array.isArray(res.data) ? res.data : [] };
  } catch {
    return none('unavailable');
  }
}

/** The office's calendar rows for the signed-in reader's church; { status: 'idle' } until enabled. */
export function useChurchCalendarRows(enabled, reader = readCalendarRows) {
  const [state, setState] = useState({ status: 'idle', rows: [] });
  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', rows: [] });
      return undefined;
    }
    let cancelled = false;
    setState({ status: 'loading', rows: [] });
    Promise.resolve()
      .then(() => reader())
      .then((r) => {
        if (!cancelled) setState(r && r.status ? r : { status: 'unavailable', rows: [] });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unavailable', rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, reader]);
  return state;
}
