// =============================================================================
// one-person-sign-ins — a person who signs in with either address opens on the
// same house (DR-1407)
// =============================================================================
// Darrell 2026-11-10: "Why don't Christina see the same page on the Big
// Picture!!!" Christina has two sign-ins, and the household a sign-in opens on
// is chosen from its own seats (join_default_instance: family first, then the
// oldest seat). A sign-in holding fewer of her seats opened on a different
// house, and Poe Properties' work orders, read under the reader's own seat,
// came back empty instead of failing.
//
// Migration 0319 gives each declared sign-in of one person the seats the other
// holds. This asks it once per signed-in account per page load, BEFORE the
// household is resolved, so an account made after 0319 is brought level on
// its first sign-in. A database without 0319 answers with an error, and the
// error is swallowed: sign-in must never wait on, or fail for, this.
// =============================================================================

const asked = new Map();

/**
 * Ask the database to bring this person's sign-ins level, once per account.
 * @param {object} client the supabase client (auth + rpc)
 * @returns {Promise<void>}
 */
export async function shareHouseholdsOnce(client) {
  let uid;
  try {
    const { data } = await client.auth.getSession();
    uid = data && data.session && data.session.user ? data.session.user.id : null;
  } catch {
    return;
  }
  if (!uid) return;
  if (!asked.has(uid)) {
    asked.set(
      uid,
      Promise.resolve()
        .then(() => client.rpc('share_my_households_across_my_sign_ins'))
        .catch(() => null)
    );
  }
  await asked.get(uid);
}

/** Test seam: forget which accounts have been asked. */
export function resetSharedHouseholds() {
  asked.clear();
}
