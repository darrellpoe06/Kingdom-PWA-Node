// =============================================================================
// TrialStatus — the visible, durable 90-day counter
// =============================================================================
// Shows "Day X of 90 — N days of full access left, then it stays free forever,
// never locked out," with a calm progress bar. Anchored to the account's
// server-side creation date (trial-status.js), so it reads the same on every
// device and every screen. This is the "visible" half of Darrell's
// "durable + visible everywhere" — mount it anywhere a signed-in user should see
// where they stand.
//
// Renders nothing for a signed-out user or a paid account with no countdown, so
// it's safe to drop into any surface. Accessibility (WCAG 2.1 AA on white):
// #1A1815 body, #5A5751 secondary, progressbar role with aria values.
import React from 'react';
import { trialFromCreatedAt, trialHeadline, formatEndDate } from '../lib/trial-status.js';

export default function TrialStatus({ createdAt, nowIso, paid = false, compact = false, familyFullAccess = false }) {
  const now = nowIso || new Date().toISOString();
  const state = trialFromCreatedAt(createdAt, now, paid);

  // Nothing to show when we can't anchor it, or for a paid account.
  if (state.phase === 'unknown' || state.phase === 'paid') return null;

  const expired = state.phase === 'expired';
  const endingSoon = state.phase === 'ending-soon';
  // Ending-soon wears the house rust — an attention accent, never true red
  // (DR-0099 reserves red); the calm green holds for the ordinary trial.
  const accent = expired ? '#7A1F1F' : endingSoon ? '#B85838' : '#5A6E3D';
  const endDate = formatEndDate(state.endsAtIso);

  // A recognized family member's access never drops (the 2026-06-13 family
  // grant) — showing THEM "your full access ends" would be untrue. Tell the
  // family truth instead of the subscriber countdown's (DR-0076 honesty).
  if (familyFullAccess && (endingSoon || expired)) {
    return (
      <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Your access</div>
        <p className="mt-2 text-[0.8125rem] text-[#1A1815] leading-relaxed">
          Family access — full features, always. (The 90-day countdown users see {expired ? 'has completed' : 'is in its final week'}; reviewer mode shows their exact experience.)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#1A1815] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
          Your free access
        </div>
        {!expired && (
          <div className="text-[0.75rem] font-semibold tabular-nums text-[#1A1815]">
            Day {state.dayNumber} of {state.totalDays}
          </div>
        )}
      </div>

      <div
        className="mt-2 h-2.5 w-full rounded-full bg-[#FAF8F4] border border-[#E8E4DC] overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={state.totalDays}
        aria-valuenow={Math.min(state.totalDays, state.dayNumber)}
        aria-label={`Day ${state.dayNumber} of ${state.totalDays} of free access`}
      >
        <div className="h-full rounded-full" style={{ width: `${state.percentElapsed}%`, background: accent }} />
      </div>

      <p className="mt-2.5 text-[0.8125rem] text-[#1A1815] leading-relaxed">
        {trialHeadline(state)}
      </p>

      {!compact && !expired && endDate && (
        <p className="mt-1 text-[0.6875rem] text-[#5A5751]">
          Full access through <span className="font-semibold text-[#1A1815]">{endDate}</span>. No charge until then — you can upgrade any time.
        </p>
      )}
      {endingSoon && (
        <p className="mt-1 text-[0.6875rem] font-semibold text-[#B85838]" role="status">
          What changes after {endDate}: premium tabs show their upgrade door; Markets, Books, Big Picture, Debts, and Church stay free forever.
        </p>
      )}
    </div>
  );
}
