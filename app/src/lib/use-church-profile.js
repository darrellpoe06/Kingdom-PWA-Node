// =============================================================================
// useChurchProfile — the caller's church profile row, for the Give panel and
// the Members tab (0297, DR-1066)
// =============================================================================
// Loads once per mount, never throws, and reports its state honestly:
//   { status: 'loading'|'ready'|'signed-out'|'no-church'|'error', instanceId,
//     slug, displayName, profile, message, reload }
// While 'loading' a surface renders from what it already has (the church
// record the shell passes), so COLG's Give panel never flashes empty; a
// loaded profile row then overrides. A failure is a state, not a crash: the
// panel falls back exactly as if no row existed, and says nothing false.
// =============================================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMyChurchProfile } from './church-profile-sync.js';

const IDLE = { status: 'loading', instanceId: null, slug: null, displayName: null, profile: null, message: '' };

export function useChurchProfile({ enabled = true } = {}) {
  const [state, setState] = useState(IDLE);
  const alive = useRef(true);
  const load = useCallback(async () => {
    if (!enabled) { setState({ ...IDLE, status: 'signed-out' }); return; }
    setState((p) => ({ ...p, status: 'loading' }));
    let res;
    try { res = await loadMyChurchProfile(); } catch (e) { res = { ok: false, reason: 'error', message: (e && e.message) || '' }; }
    if (!alive.current) return;
    if (res && res.ok) {
      setState({ status: 'ready', instanceId: res.instanceId, slug: res.slug, displayName: res.displayName, profile: res.profile, message: '' });
    } else {
      const reason = (res && res.reason) || 'error';
      setState({ ...IDLE, status: reason === 'signed-out' || reason === 'no-church' ? reason : 'error', message: (res && res.message) || '' });
    }
  }, [enabled]);
  useEffect(() => { alive.current = true; load(); return () => { alive.current = false; }; }, [load]);
  return { ...state, reload: load };
}

export default useChurchProfile;
