// =============================================================================
// use-prospects — the two mounts of the calculator keep prospects the same way
// =============================================================================
// Both Debt Freedom and Real Estate hand the calculator the household's list of
// properties being weighed and the two writers for it (DR-1415). The write is
// one key, data.moneyPlan.prospects, through the shell's own setData and the
// plan's own stamp (patchMoneyPlan), so it rides the household snapshot exactly
// as the rest of the Money settings do. With no setData (a read-only seat) the
// writers are null and the calculator offers no save.
// =============================================================================
import { useMemo } from 'react';
import { patchMoneyPlan } from './money-plan.js';
import { prospectsOf, upsertProspect, removeProspect } from './purchase-prospects.js';

export function useProspects(moneyPlan, setData) {
  const prospects = useMemo(() => prospectsOf({ moneyPlan }), [moneyPlan]);
  const writers = useMemo(() => {
    if (typeof setData !== 'function') return { onSaveProspect: null, onRemoveProspect: null };
    const write = (change) => setData((d) => ({ ...d, moneyPlan: patchMoneyPlan(d.moneyPlan, { prospects: change(prospectsOf(d)) }) }));
    return {
      onSaveProspect: (p) => write((list) => upsertProspect(list, p)),
      onRemoveProspect: (id) => write((list) => removeProspect(list, id)),
    };
  }, [setData]);
  return { prospects, ...writers };
}
