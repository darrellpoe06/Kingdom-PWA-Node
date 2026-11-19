// =============================================================================
// church-archive-sync — the church's kept calendars, letters and flyers, read
// for the signed-in reader's own church (DR-1596)
// =============================================================================
// SCOPE IS THE CHURCH INSTANCE, not the user: these are what the church office
// published on its public website, the church's shared record, holding no
// person's data (DATA-AS-EMPOWERMENT: the church owns it; rows are plain
// columns and the pictures plain files, exportable as they are).
//
// The rows are church_site_archive (migration 0342), written by the daily
// reader only. RLS is the gate (DR-0060): a member reads only their own
// church's archive; the query names that church too, the way the calendar's
// read does (lib/church-calendar-sync.js). The pictures are in a PRIVATE
// bucket, so each is opened by a short-lived signed address, asked for in one
// batch per month the reader opens.
//
// A read that could not be made is 'unavailable', never an empty archive
// (DR-1053). Every call is bounded by READ_TIMEOUT_MS.
// =============================================================================
import { useCallback, useEffect, useState } from 'react';
import supabase from './supabase.js';
import { churchInstanceResolve } from './church-instance.js';
import { ARCHIVE_BUCKET } from './church-archive.js';

export const READ_TIMEOUT_MS = 8000;
export const SIGNED_URL_SECONDS = 3600;
const COLUMNS = 'id, kind, title, for_year, for_month, month_from, storage_path, found_via, first_seen_at, last_seen_at';

const timeout = (ms) => new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), ms));

/** { status: 'ok', rows } | { status: 'signed-out' | 'no-church' | 'unavailable', rows: [] }. Never throws. */
export async function readArchiveRows({ client = supabase, resolveChurch = churchInstanceResolve, timeoutMs = READ_TIMEOUT_MS } = {}) {
  const none = (status) => ({ status, rows: [] });
  try {
    const { data } = await client.auth.getSession();
    if (!data || !data.session) return none('signed-out');
    const church = await Promise.race([resolveChurch(), timeout(timeoutMs)]);
    if (!church || church.timedOut || !church.ok) return none('unavailable');
    if (!church.value) return none('no-church');
    const read = client
      .from('church_site_archive')
      .select(COLUMNS)
      .eq('instance_id', church.value)
      .order('for_year', { ascending: false })
      .order('for_month', { ascending: false });
    const res = await Promise.race([read, timeout(timeoutMs)]);
    if (!res || res.timedOut || res.error) return none('unavailable');
    return { status: 'ok', rows: Array.isArray(res.data) ? res.data : [] };
  } catch {
    return none('unavailable');
  }
}

/** { [path]: signedUrl } for the paths that could be signed; {} when none could. Never throws. */
export async function signArchivePaths(paths, { client = supabase, timeoutMs = READ_TIMEOUT_MS, seconds = SIGNED_URL_SECONDS } = {}) {
  const list = [...new Set((Array.isArray(paths) ? paths : []).filter((p) => typeof p === 'string' && p))];
  if (!list.length) return {};
  try {
    const res = await Promise.race([client.storage.from(ARCHIVE_BUCKET).createSignedUrls(list, seconds), timeout(timeoutMs)]);
    if (!res || res.timedOut || res.error || !Array.isArray(res.data)) return {};
    const out = {};
    for (const r of res.data) if (r && r.path && r.signedUrl && !r.error) out[r.path] = r.signedUrl;
    return out;
  } catch {
    return {};
  }
}

/** The archive rows for the signed-in reader's church; { status: 'idle' } until enabled. */
export function useChurchArchiveRows(enabled, reader = readArchiveRows) {
  const [state, setState] = useState({ status: 'idle', rows: [] });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);
  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', rows: [] });
      return undefined;
    }
    let cancelled = false;
    setState((cur) => (cur.status === 'ok' ? cur : { status: 'loading', rows: [] }));
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
  }, [enabled, reader, tick]);
  return { ...state, reload };
}
