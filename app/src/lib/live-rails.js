// =============================================================================
// live-rails — the 0077 rails' shell adapters, kept OUT of the frozen monolith
// =============================================================================
// The monolith is frozen (monolith-budget-guard): new machinery ships as a
// module. These two exports are everything the shell needs to wire the
// 2026-07-05 live-data rails in a handful of lines:
//
//   makeSyncedListCrud — the add/update/remove reducer bodies for a doc-rail
//     list (upload + remoteUuid stamp + wholesale doc patch + fail-soft),
//     the exact pattern the shell repeats for contractors/recipes, factored
//     once instead of five more hand-copied blocks.
//   wireLiveRails — the watchlist + module-interest subscribe wiring (the two
//     hand-shaped rails that don't fit the generic tables loop).
//
// Everything here is fail-soft: signed out or pre-0077-migration, calls skip
// and the device keeps working from localStorage (see doc-sync.js).
import { docPatch } from './doc-sync.js';
import { initialSyncWatchlist, subscribeWatchlist, mergeWatchlists } from './watchlist-sync.js';
import { subscribeModuleInterest } from './module-interest-sync.js';

// CRUD for one doc-rail list. The shell supplies its closures:
//   setData  — the state setter
//   getData  — () => latest data (for delete's remoteUuid lookup)
//   canSync  — (d?) => the shell's sync gate (auth + verified + not-demo);
//              update passes the in-flight draft state `d` so the gate reads
//              the freshest numericSyncVerifiedAt (the updateContractor fix).
//   warn     — the shell's syncWarn
export function makeSyncedListCrud({ sync, key, label, setData, getData, canSync, warn }) {
  const stamp = (id, remoteId) => setData((d) => ({
    ...d, [key]: (d[key] || []).map((x) => (x.id === id ? { ...x, remoteUuid: remoteId } : x)),
  }));
  return {
    add(seeded) {
      setData((d) => ({ ...d, [key]: [...(d[key] || []), seeded] }));
      if (canSync()) {
        sync.upload(seeded)
          .then((res) => { if (res && res.remoteId) stamp(seeded.id, res.remoteId); })
          .catch((e) => warn(`[${label}] upload failed`, e));
      }
      return seeded.id;
    },
    update(id, updates) {
      setData((d) => {
        const next = (d[key] || []).map((x) => (x.id === id ? { ...x, ...updates } : x));
        if (canSync(d)) {
          const updated = next.find((x) => x.id === id);
          if (updated && updated.remoteUuid) {
            sync.updateRow(updated.remoteUuid, docPatch(updated)).catch((e) => warn(`[${label}] update failed`, e));
          }
        }
        return { ...d, [key]: next };
      });
    },
    remove(id) {
      if (canSync()) {
        const current = ((getData() || {})[key] || []).find((x) => x.id === id);
        if (current && current.remoteUuid) {
          sync.deleteRow(current.remoteUuid).catch((e) => warn(`[${label}] delete failed`, e));
        }
      }
      setData((d) => ({ ...d, [key]: (d[key] || []).filter((x) => x.id !== id) }));
    },
  };
}

// Wire the two hand-shaped rails straight onto the shell's state setters.
// Returns the unsubscribe fns for the shell's cleanup list. Remote symbols
// merge into (never replace) the local watchlist; my votes hydrate
// data.moduleInterest (the shape About renders) while the FAMILY aggregate
// lands in its own setter so "family priority votes" is a real count.
export async function wireLiveRails({ localWatchlist = [], localVotes = {}, setData, setFamilyModuleInterest, warn }) {
  const cleanups = [];
  const applyWatchlist = (symbols) => setData((d) => ({ ...d, watchlist: mergeWatchlists(d.watchlist || [], symbols) }));
  try {
    const wl = await initialSyncWatchlist(localWatchlist);
    if (wl && wl.merged) applyWatchlist(wl.merged);
  } catch (e) {
    warn('[watchlist-sync] initial sync failed', e);
  }
  cleanups.push(subscribeWatchlist(applyWatchlist));
  cleanups.push(subscribeModuleInterest(({ mine, family }) => {
    setData((d) => ({ ...d, moduleInterest: { ...(d.moduleInterest || {}), ...mine } }));
    setFamilyModuleInterest(family);
  }, { localVotes }));
  return cleanups;
}
