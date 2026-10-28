// SampleModeNotice — what a self-fetching Money tab shows instead of real rows
// while the app is in sample mode (Christina 2026-10-28: Owed, Plan, Taxes and
// 1099s fetched the family's real records with the signed-in session even
// inside the sample). One honest panel, no fetch behind it.
import React from 'react';

const SERIF = { fontFamily: '"Fraunces", Georgia, serif' };

export default function SampleModeNotice({ what = 'records', testId = 'sample-mode-notice' }) {
  return (
    <section data-testid={testId} role="note" aria-label="Sample mode" className="rounded-2xl border border-[#C9A227] bg-[#FBF7EC] p-4 text-[#1A1815]">
      <div className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#B85838] font-semibold">Sample mode</div>
      <p className="mt-1 text-[0.875rem] leading-relaxed" style={SERIF}>
        This is the working sample. Your household's real {what} are not loaded here, and nothing you enter in the sample is saved.
      </p>
      <p className="mt-1 text-[0.75rem] text-[#5A5751]">To work with your own {what}, open the app at poetech.us and sign in there.</p>
    </section>
  );
}
