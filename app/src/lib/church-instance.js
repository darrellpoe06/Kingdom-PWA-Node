// church-instance — the ONE resolver every Church-module surface uses to find
// (and, for allowlisted leaders, auto-join) the church tenant.
//
// Modularity (Darrell 2026-06-14: "modules work independently, interdependent
// when connected"): Choir, Engagement/Trivia, and any future Church surface all
// scope to the SAME church instance through this single function — so the Church
// module is internally coherent (interdependent) and isolated from the family
// instance (independent). Returns the church instance id, or null when the user
// has no church access (callers degrade to empty / "ask to be added").
import supabase from './supabase.js';

export async function churchInstanceId(displayName) {
  const { data, error } = await supabase.rpc('join_church_instance', { display_name_in: displayName ?? null });
  if (error) { console.warn('[church-instance] resolve failed:', error); return null; }
  return data ?? null;
}
