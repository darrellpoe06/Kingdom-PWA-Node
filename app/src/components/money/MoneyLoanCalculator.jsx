// =============================================================================
// MoneyLoanCalculator — the calculator inside Debt Freedom (DR-1413)
// =============================================================================
// Hands the shared MortgageCalculator every loan this person may see: each
// property's mortgage and each debt on the ledger, grouped by entity
// (lib/mortgage-sources.js). Mounted closed, under the home mortgage card, so
// nothing already on this screen moves until a person opens it. Read-only.
// =============================================================================
import React, { useMemo } from 'react';
import MortgageCalculator from '../MortgageCalculator.jsx';
import { loanGroups } from '../../lib/mortgage-sources.js';

export default function MoneyLoanCalculator({ money }) {
  const { data = {}, derivedDebts = [], currentDate, visibleEntities = null } = money || {};
  const sources = useMemo(() => loanGroups({
    rentals: (data.inflows && data.inflows.rentals) || [], debts: derivedDebts, entities: visibleEntities || data.entities || null,
  }), [data.inflows, data.entities, derivedDebts, visibleEntities]);
  return (
    <MortgageCalculator
      sources={sources}
      currentDate={currentDate}
      lead="Choose any mortgage or debt on file, by entity, to fill in its real balance, rate and payment, then see what extra principal does to it."
    />
  );
}
