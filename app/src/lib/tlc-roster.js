// =============================================================================
// tlc-roster — "Match a Preferred Provider": the live roster over the seed
// =============================================================================
// Darrell, 2026-09-10: "On-boarding should also update the Apps and other
// online locations with new Therapists using the same format as the current
// ones." The current ones are TLC_TEAM in lib/tlc-practice.js — seven cards
// of { name, role, specialty, url, photo }. This module keeps that FORMAT and
// adds the LIVE rows migration 0187 publishes when Christina approves a
// packet (tlc_public_roster(), public columns only, anon-readable).
//
// One roster, three surfaces: the TLC door, the Moore door's Practice tab and
// the operator Practice tab all call useTlcRoster() and render the same list —
// the seed first (Christina leads), then the approved colleagues, a live row
// replacing a seed card that names the same person. Offline or before the
// migration lands, the seed alone renders; nothing spins, nothing blanks.
import { useEffect, useState } from 'react';
import supabase from './supabase.js';
import { TLC_TEAM } from './tlc-practice.js';

export const ROSTER_FETCH_TIMEOUT_MS = 8000;
export { rosterCard, mergeRoster, rosterCardFromPacket, ROSTER_ROLE_DEFAULT, ROSTER_FALLBACK_URL } from './tlc-roster-cards.js';
import { mergeRoster } from './tlc-roster-cards.js';

function withTimeout(promise, ms) {
  let t;
  return Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(new Error('roster fetch timed out')), ms); })]).finally(() => clearTimeout(t));
}

export async function fetchPublicRoster(officeId = 'tlc') {
  try {
    const { data, error } = await withTimeout(supabase.rpc('tlc_public_roster', { office_in: officeId }), ROSTER_FETCH_TIMEOUT_MS);
    if (error) return [];
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

// Office editor seam (owner/admin; RLS + the functions decide).
export async function listRoster() {
  try {
    const { data, error } = await withTimeout(supabase.rpc('tlc_roster_list'), ROSTER_FETCH_TIMEOUT_MS);
    if (error) return { ok: false, message: error.message, rows: [] };
    return { ok: true, rows: Array.isArray(data) ? data : [] };
  } catch (e) { return { ok: false, message: (e && e.message) || 'the connection failed', rows: [] }; }
}
export async function upsertRosterCard(card) {
  try {
    const { data, error } = await withTimeout(supabase.rpc('tlc_roster_upsert', { row_in: card }), ROSTER_FETCH_TIMEOUT_MS);
    if (error) return { ok: false, message: error.message };
    invalidateRoster();
    return { ok: true, row: data };
  } catch (e) { return { ok: false, message: (e && e.message) || 'the connection failed' }; }
}
export async function removeRosterCard(id) {
  try {
    const { data, error } = await withTimeout(supabase.rpc('tlc_roster_remove', { id_in: id }), ROSTER_FETCH_TIMEOUT_MS);
    if (error) return { ok: false, message: error.message };
    invalidateRoster();
    return { ok: true, removed: data === true };
  } catch (e) { return { ok: false, message: (e && e.message) || 'the connection failed' }; }
}

// One fetch per page load, shared by every surface; invalidated by an edit.
let cached = null;
let inflight = null;
export function invalidateRoster() { cached = null; inflight = null; }
export function __resetRosterCache() { invalidateRoster(); }
async function load(officeId) {
  if (cached) return cached;
  if (!inflight) inflight = fetchPublicRoster(officeId).then((rows) => { cached = rows; inflight = null; return rows; });
  return inflight;
}

export function useTlcRoster(officeId = 'tlc') {
  const [live, setLive] = useState(() => cached || []);
  useEffect(() => {
    let alive = true;
    load(officeId).then((rows) => { if (alive) setLive(rows); });
    return () => { alive = false; };
  }, [officeId]);
  return mergeRoster(TLC_TEAM, live);
}
