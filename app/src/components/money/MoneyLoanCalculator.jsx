// =============================================================================
// MoneyLoanCalculator — the calculator inside Debt Freedom (DR-1413)
// =============================================================================
// Hands the shared MortgageCalculator every loan this person may see: every
// property (its mortgage, or the plain statement that none is entered) and
// each debt on the ledger, grouped by entity (lib/mortgage-sources.js), with
// the properties being weighed (DR-1414). Mounted closed, under the home
// mortgage card, so nothing already on this screen moves until a person opens
// it. It saves only on a named button (DR-1415).
// =============================================================================
import React, { useMemo } from 'react';
import MortgageCalculator from '../MortgageCalculator.jsx';
import { loanGroups } from '../../lib/mortgage-sources.js';
import { useProspects } from '../../lib/use-prospects.js';

export default function MoneyLoanCalculator({ money }) {
  const { data = {}, setData, derivedDebts = [], currentDate, visibleEntities = null, updateRental = null } = money || {};
  const entities = visibleEntities || data.entities || null;
  const { prospects, onSaveProspect, onRemoveProspect } = useProspects(data.moneyPlan, setData);
  const sources = useMemo(
    () => loanGroups({ rentals: (data.inflows && data.inflows.rentals) || [], debts: derivedDebts, entities, prospects }),
    [data.inflows, derivedDebts, entities, prospects]
  );
  return (
    <MortgageCalculator
      sources={sources}
      currentDate={currentDate}
      entities={entities}
      onSaveProspect={onSaveProspect}
      onRemoveProspect={onRemoveProspect}
      onSaveRecord={typeof updateRental === 'function' ? updateRental : null}
      idBase="mc-money"
      lead="Every property and every debt, by entity: choose one to fill in its real figures and see what paying it down does, or work out a property you are weighing."
    />
  );
}
