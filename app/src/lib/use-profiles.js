// =============================================================================
// use-profiles — the pictures and names of the people on a surface
// =============================================================================
// Darrell, 2026-09-09 (his own saved profile on the screen, the thread list
// beside it showing bare usernames): "Make sure the picture is visible on the
// apps... users like to see their picture." A profile that shows only on its
// own card is a profile nobody sees. This hook hands a surface the profiles of
// every person it lists — one cached read per person (`loadProfile`, DR-0342:
// a thumbnail by id, never bytes in a list) — so the thread list, the thread
// header, the start chips and the message bubbles can all carry the face and
// the chosen display name, from one source.
//
// Honest by shape: a person without a profile is `null` (the surface falls
// back to the name it already had and initials); a read that fails is `null`
// too, never a throw into the render.
import { useEffect, useMemo, useState } from 'react';
import { loadProfile } from './profiles-sync.js';

/**
 * @param {string[]} userIds  the people on the surface (duplicates and blanks ignored)
 * @returns {Record<string, object|null>} userId -> profile (or null); absent while loading
 */
export function useProfiles(userIds) {
  const key = useMemo(() => [...new Set((userIds || []).filter(Boolean))].sort().join(','), [userIds]);
  const [profiles, setProfiles] = useState({});
  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    const ids = key.split(',');
    Promise.all(ids.map((id) => loadProfile(id).catch(() => null))).then((list) => {
      if (!alive) return;
      setProfiles((prev) => {
        const next = { ...prev };
        ids.forEach((id, i) => { next[id] = list[i] || null; });
        return next;
      });
    });
    return () => { alive = false; };
  }, [key]);
  return profiles;
}

/** The name a surface should show for a person: their chosen profile name first. */
export function preferredName(profile, ...fallbacks) {
  if (profile && profile.displayName) return profile.displayName;
  return fallbacks.find((f) => typeof f === 'string' && f.trim()) || 'Member';
}
