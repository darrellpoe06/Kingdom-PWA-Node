// =============================================================================
// books-accounts-crud — the accounts CRUD, peeled out of the monolith shell
// =============================================================================
// First peel of the DR-0078 standing commitment's next phase (Darrell
// 2026-07-31: the commitment to reduce the monolith is decided work, not a
// recommendation to re-surface). Moved VERBATIM from poe-financial-mvp-v28.jsx
// (characterize-before-change, DR-0076 §5): same reducers, same sync gates,
// same remoteUuid stamping, same manual-balance interception
// (resolveAccountUpdates → a balance-adjustment ROW on a ledgered account).
//
// A factory instead of four inline closures: the monolith calls
// createAccountsCrud once per render with that render's live values (data,
// syncEnabled, currentDate) — identical closure semantics to the inline
// originals, but the logic now unit-tests directly (books-accounts-crud.test.js)
// and the shell shrinks. `postTx` is a thunk so the monolith can hand over
// addTransaction without evaluation-order concerns.
// =============================================================================
import { resolveAccountUpdates } from './financial-engineering.js';

// Account ids are minted from the clock, and `Date.now()` is only
// millisecond-granular — a loop that adds several accounts in one tick hands
// every one of them the SAME id. That was harmless while accounts were added
// one tap at a time, but importing a family's card list adds 27 in a single
// synchronous pass: they would collapse onto one id, React would key them
// together, and every follow-on edit would hit the wrong row.
//
// This keeps the id monotonic instead: normally the clock, but never a repeat.
// The format stays `a-<digits>` on purpose — migration 0129 identifies
// hand-added accounts by the `^a-[0-9]+$` slug pattern, so a suffix like
// `a-1234-2` would quietly fall out of that class.
let lastAccountSeq = 0;
export function nextAccountId() {
  const now = Date.now();
  lastAccountSeq = now > lastAccountSeq ? now : lastAccountSeq + 1;
  return `a-${lastAccountSeq}`;
}

export function createAccountsCrud({ data, setData, syncEnabled, accountsSync, syncWarn, postTx, currentDate = new Date() }) {
  // Shared by the single and bulk add paths so they can never drift apart.
  const seedAccount = (item) => ({
    ...item, id: nextAccountId(), balance: parseFloat(item.balance) || 0, inLegal: !!item.inLegal,
  });
  const uploadSeeded = (seeded) => {
    if (!syncEnabled) return;
    // Stamp remoteUuid as soon as the insert lands so follow-on edits/deletes
    // reach the cloud row immediately (else they silently no-op until a
    // realtime refetch backfills it). Matches the incidents pattern.
    accountsSync.upload(seeded).then((res) => {
      if (res && res.remoteId) setData(d => ({ ...d, accounts: (d.accounts || []).map(a => a.id === seeded.id ? { ...a, remoteUuid: res.remoteId } : a) }));
    }).catch(e => syncWarn('[accounts-sync] upload failed', e));
  };
  const addAccount = (item) => {
    const seeded = seedAccount(item);
    setData(d => ({ ...d, accounts: [...(d.accounts || []), seeded] }));
    uploadSeeded(seeded);
    return seeded;
  };
  // addAccounts — add many at once (the Debts-tab card-list import). One state
  // update for the whole batch rather than N sequential ones, so the tab shows
  // the full list in a single render; uploads still go per-row, because each
  // needs its own remoteUuid stamped back. Returns the seeded rows.
  const addAccounts = (items) => {
    const seeded = (items || []).map(seedAccount);
    if (!seeded.length) return [];
    setData(d => ({ ...d, accounts: [...(d.accounts || []), ...seeded] }));
    seeded.forEach(uploadSeeded);
    return seeded;
  };
  const updateAccount = (id, updates) => {
    // Manual balance on a ledgered account → an adjustment ROW, never a moved
    // anchor that re-adds imported history (see resolveAccountUpdates).
    updates = resolveAccountUpdates(data, id, updates, currentDate, postTx);
    setData(d => ({ ...d, accounts: (d.accounts || []).map(a => a.id === id ? { ...a, ...updates, balance: updates.balance !== undefined ? parseFloat(updates.balance) || 0 : a.balance } : a) }));
    if (syncEnabled) {
      const local = (data.accounts || []).find(a => a.id === id);
      if (local && local.remoteUuid) {
        const patch = {};
        if (updates.name !== undefined)        patch.display_name = updates.name;
        if (updates.institution !== undefined) patch.institution = updates.institution;
        if (updates.type !== undefined)        patch.account_type = updates.type;
        if (updates.fragment !== undefined)    patch.fragment = updates.fragment;
        if (updates.balance !== undefined)     patch.balance = parseFloat(updates.balance) || 0;
        if (updates.inLegal !== undefined)     patch.in_legal = !!updates.inLegal;
        if (updates.isPrimary !== undefined)   patch.is_primary = !!updates.isPrimary;
        if (updates.entityId !== undefined)    patch.entity_slug = updates.entityId;
        // The debt declaration (0129): "Treat as debt" and the inline Debts-tab
        // rate/min edits must reach the cloud row, or the next refetch undoes them.
        if (updates.treatAsDebt !== undefined) patch.treat_as_debt = !!updates.treatAsDebt;
        if (updates.minPayment !== undefined)  patch.min_payment = parseFloat(updates.minPayment) || 0;
        if (updates.rate !== undefined)        patch.rate = parseFloat(updates.rate) || 0;
        // The card's own terms (0133). A cleared field must reach the cloud as
        // NULL, not 0 — an erased limit means "unknown", and writing 0 would
        // claim a zero limit the family never entered.
        const numOrNull = (v) => (v === null || v === undefined || v === '' ? null : (isFinite(parseFloat(v)) ? parseFloat(v) : null));
        if (updates.creditLimit !== undefined)    patch.credit_limit = numOrNull(updates.creditLimit);
        if (updates.highestBalance !== undefined) patch.highest_balance = numOrNull(updates.highestBalance);
        if (updates.rateMin !== undefined)        patch.rate_min = numOrNull(updates.rateMin);
        if (updates.rateKnown !== undefined)      patch.rate_known = !!updates.rateKnown;
        // Per-row switches from the Debts editor (0134).
        if (updates.leaveAlone !== undefined)     patch.leave_alone = !!updates.leaveAlone;
        if (updates.rateOverridden !== undefined) patch.rate_overridden = !!updates.rateOverridden;
        if (Object.keys(patch).length) accountsSync.updateRow(local.remoteUuid, patch).catch(e => syncWarn('[accounts-sync] update failed', e));
      }
    }
  };
  // 2026-05-24 — Move-to-Legal toggle: flips inLegal (out of cash totals and the
  // Accounts tab, into Legal). Reversible via the Legal tab's Restore button.
  const toggleAccountLegal = (id) => {
    const a = (data.accounts || []).find(x => x.id === id);
    if (!a) return;
    updateAccount(id, { inLegal: !a.inLegal });
  };
  const deleteAccount = (id) => {
    if (syncEnabled) {
      const local = (data.accounts || []).find(a => a.id === id);
      if (local && local.remoteUuid) {
        accountsSync.deleteRow(local.remoteUuid).catch(e => syncWarn('[accounts-sync] delete failed', e));
      }
    }
    setData(d => ({ ...d, accounts: (d.accounts || []).filter(a => a.id !== id) }));
  };
  return { addAccount, addAccounts, toggleAccountLegal, updateAccount, deleteAccount };
}
