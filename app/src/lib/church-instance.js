// church-instance — the ONE resolver every Church-module surface uses to find
// (and, for allowlisted leaders, auto-join) the church tenant.
//
// Modularity (Darrell 2026-06-14: "modules work independently, interdependent
// when connected"): Choir, Engagement/Trivia, and any future Church surface all
// scope to the SAME church instance through this single function — so the Church
// module is internally coherent (interdependent) and isolated from the family
// instance (independent). Returns the church instance id, or null when the user
// has no church access (callers degrade to empty / "ask to be added").
//
// WHY THERE ARE NOW TWO FUNCTIONS (DR-1053). The old single function collapsed
// two different worlds into the same null:
//
//     if (error) { console.warn(...); return null; }
//
// "You belong to no church" and "we could not ask" came out identical, and all
// 23 callers read that null as the first one. That is how a stalled read on a
// phone became the Choir tab telling Darrell to ask the director to add him.
//
//   churchInstanceResolve()  the honest answer: { ok:true, value } when we got
//                            one (value may legitimately be null), or
//                            { ok:false, reason } when we did not. New callers
//                            use this.
//   churchInstanceId()       the old shape, kept verbatim for all 23 existing
//                            callers so nothing churns — now built on the
//                            resolver, which means they all quietly gain the
//                            bounded retry. null still means null; it simply
//                            takes three stalled attempts to say so instead of
//                            believing the first one.
import { ask } from './church-access.js';
import supabase from './supabase.js';

/** The caller's church, as a three-valued answer. Never throws. */
export async function churchInstanceResolve(displayName, opts) {
  return ask(() => supabase.rpc('join_church_instance', { display_name_in: displayName ?? null }), opts);
}

export async function churchInstanceId(displayName) {
  const answer = await churchInstanceResolve(displayName);
  if (!answer.ok) { console.warn('[church-instance] resolve failed:', answer.message); return null; }
  return answer.value ?? null;
}
