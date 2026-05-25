// =============================================================================
// VerifyBalances — gate before numeric-table sync opens to other devices
// =============================================================================
// Per the Option-C seed-handling design (see memory/project_full-data-sync-
// next-priority and SESSION-HANDOFF-2026-05-24.md item 1.1):
//
//   1. First sign-in uploads local seed to Supabase (entities → accounts →
//      debts → transactions → projects).
//   2. Cross-device sync of those numeric tables is GATED behind THIS
//      walkthrough — the user steps through each entity/account/debt and
//      confirms the starting balance.
//   3. Only after completion does the verifiedAt timestamp land in local
//      state and the app activate the realtime subscriptions and per-CRUD
//      uploads for numeric tables.
//
// Per-device, per-install. Christina signing in on her phone runs this
// walkthrough on HER device before her phone starts pushing changes that
// would propagate to the family's tenant. Errs on the side of "every
// device confirms what it sees before it can write."
//
// Style matches the rest of the MVP: serif Fraunces for prose, JetBrains
// Mono for numbers, the existing rust/cream/charcoal palette.
//
// Props:
//   data       — the current app state (reads entities, accounts, debts,
//                inflows.rentals)
//   onComplete — callback fired when the user confirms all steps. Receives
//                an ISO timestamp string. The parent wires this to setData
//                so data.numericSyncVerifiedAt persists and the sync
//                effect can fan out.
//   onSkip     — callback fired when the user dismisses without verifying.
//                Sync stays paused until they re-open the walkthrough.
// =============================================================================
import React, { useMemo, useState } from 'react';

function fmt(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Number(n) || 0);
  return sign + '$' + abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function StepHeader({ stepIndex, totalSteps, title, subtitle }) {
  return (
    <div className="border-b border-[#E8E4DC] pb-3 mb-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-1">
        Step {stepIndex + 1} of {totalSteps}
      </div>
      <h2 className="text-2xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function EntitiesStep({ entities }) {
  if (!entities || entities.length === 0) {
    return (
      <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        No entities yet. Skip ahead — accounts will use the default Personal entity.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {entities.map(e => (
        <li key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{e.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5">{e.type}</div>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D]">on file</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function NumericStep({ items, valueField, label, emptyHint }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        {emptyHint}
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {items.map(item => (
        <li key={item.id} className="bg-white border border-[#E8E4DC] px-3 py-2 flex items-baseline justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ fontFamily: '"Fraunces", serif' }}>
              {item.name || item.title || item.description || '(unnamed)'}
            </div>
            {item.entityId && (
              <div className="text-[10px] text-[#5A5751] uppercase tracking-wider mt-0.5">
                {item.entityId}
              </div>
            )}
          </div>
          <div
            className={`text-right shrink-0 ${Number(item[valueField]) < 0 ? 'text-[#B85838]' : ''}`}
            style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}
          >
            {fmt(item[valueField])}
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mt-0.5">{label}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function VerifyBalances({ data, onComplete, onSkip }) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(() => {
    const entities = data?.entities || [];
    const accounts = data?.accounts || [];
    const debts    = data?.debts    || [];
    const rentals  = data?.inflows?.rentals || [];
    return [
      {
        title: 'Confirm your entities',
        subtitle: 'These are the umbrellas everything else lives under. Walk down the list — if the names look right, hit Confirm.',
        body: <EntitiesStep entities={entities} />,
        countLabel: `${entities.length} ${entities.length === 1 ? 'entity' : 'entities'}`,
      },
      {
        title: 'Confirm your account balances',
        subtitle: 'These starting numbers seed the cash forecast. If something is off, hit Skip — sync will stay paused so you can fix in Books → Accounts first.',
        body: <NumericStep items={accounts} valueField="balance" label="balance" emptyHint="No accounts yet. Add some in Books → Accounts before signing in elsewhere." />,
        countLabel: `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}`,
      },
      {
        title: 'Confirm your debt balances',
        subtitle: 'These drive the debt-free projection. Off by a dollar is fine; off by a thousand changes the headline. Look hard.',
        body: <NumericStep items={debts} valueField="balance" label="balance" emptyHint="No debts on file. Move on." />,
        countLabel: `${debts.length} ${debts.length === 1 ? 'debt' : 'debts'}`,
      },
      {
        title: 'Confirm your rentals',
        subtitle: 'Monthly rent figures here flow into the rental snowball and cash-flow projection. Anything stale, fix in Real Estate → Properties before opening sync.',
        body: <NumericStep items={rentals} valueField="monthlyRent" label="monthly rent" emptyHint="No rental properties on file. Move on." />,
        countLabel: `${rentals.length} ${rentals.length === 1 ? 'property' : 'properties'}`,
      },
    ];
  }, [data]);

  const total = steps.length;
  const step = steps[stepIndex];
  const isLast = stepIndex === total - 1;

  function next() {
    if (isLast) {
      onComplete(new Date().toISOString());
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  function back() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center p-3 sm:p-6 bg-[#1A1815]/60" role="dialog" aria-modal="true" aria-label="Verify balances before opening cross-device sync">
      <div className="bg-[#FAF8F4] border-2 border-[#1A1815] max-w-2xl w-full max-h-[90vh] flex flex-col mt-4">
        {/* Header strip */}
        <div className="bg-[#1A1815] text-[#FAF8F4] px-4 py-3 flex items-baseline justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Verify before sync opens</div>
            <div className="text-sm mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
              Cross-device sync is paused on this device.
            </div>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="text-[10px] uppercase tracking-wider text-[#FAF8F4]/70 hover:text-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] px-2 py-1"
            aria-label="Close without verifying — sync stays paused"
          >
            × Close
          </button>
        </div>

        {/* Step body */}
        <div className="p-5 overflow-y-auto flex-1">
          <StepHeader stepIndex={stepIndex} totalSteps={total} title={step.title} subtitle={step.subtitle} />
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-2">{step.countLabel}</div>
          {step.body}
        </div>

        {/* Footer actions */}
        <div className="border-t-2 border-[#1A1815] px-4 py-3 bg-white flex flex-wrap items-baseline justify-between gap-2">
          <button
            type="button"
            onClick={back}
            disabled={stepIndex === 0}
            className="text-[10px] uppercase tracking-wider px-3 py-2 border border-[#E8E4DC] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            ← Back
          </button>
          <div className="flex items-baseline gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="text-[10px] uppercase tracking-wider px-3 py-2 text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Skip — keep sync paused
            </button>
            <button
              type="button"
              onClick={next}
              className="text-[11px] uppercase tracking-wider px-4 py-2 bg-[#1A1815] text-[#FAF8F4] hover:bg-[#B85838] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              {isLast ? 'Confirm — open sync' : 'Confirm — next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
