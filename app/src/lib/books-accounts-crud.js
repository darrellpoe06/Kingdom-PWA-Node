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

export function createAccountsCrud({ data, setData, syncEnabled, accountsSync, syncWarn, postTx, currentDate = new Date() }) {
  const addAccount = (item) => {
    const seeded = { ...item, id: `a-${Date.now()}`, balance: parseFloat(item.balance) || 0, inLegal: !!item.inLegal };
    setData(d => ({ ...d, accounts: [...(d.accounts || []), seeded] }));
    if (syncEnabled) {
      // Stamp remoteUuid as soon as the insert lands so follow-on edits/deletes
      // reach the cloud row immediately (else they silently no-op until a
      // realtime refetch backfills it). Matches the incidents pattern.
      accountsSync.upload(seeded).then((res) => {
        if (res && res.remoteId) setData(d => ({ ...d, accounts: (d.accounts || []).map(a => a.id === seeded.id ? { ...a, remoteUuid: res.remoteId } : a) }));
      }).catch(e => syncWarn('[accounts-sync] upload failed', e));
    }
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
  return { addAccount, toggleAccountLegal, updateAccount, deleteAccount };
}
