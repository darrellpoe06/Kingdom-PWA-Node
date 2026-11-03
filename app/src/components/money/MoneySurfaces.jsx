// =============================================================================
// MoneySurfaces — the render switch for the Money sections this redesign adds
// =============================================================================
// Registered in surfaces.js as the `overview` books sub (lazy chunk); the shell
// mounts it with ONE line for every new section id, beside the twelve legacy
// branches it never touched. `money` is the shell's own bag of real data and
// writers (data, setData, currentDate, derivedDebts, totals, ...), so every
// section reads what Big Picture and the Debts tab read. An id this switch does
// not know falls through to the Overview — never a blank page (P15).
// =============================================================================
import React from 'react';
import MoneyOverview from './MoneyOverview.jsx';
import MoneySetup from './MoneySetup.jsx';
import { MoneyBudget, MoneyBills, MoneyGoals, MoneyDebtFreedom, MoneyReports } from './MoneySections.jsx';

const PANELS = {
  overview: MoneyOverview,
  budget: MoneyBudget,
  bills: MoneyBills,
  goals: MoneyGoals,
  'debt-freedom': MoneyDebtFreedom,
  reports: MoneyReports,
  settings: MoneySetup,
};

export default function MoneySurfaces({ section = 'overview', money }) {
  const Panel = PANELS[section] || MoneyOverview;
  return <Panel money={money} />;
}
