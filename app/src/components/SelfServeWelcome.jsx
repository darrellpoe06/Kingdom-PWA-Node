// =============================================================================
// SelfServeWelcome — the first thing a NEW, non-family signed-in user sees
// =============================================================================
// DR-0059 Phase 2. Self-serve sign-ups land in their own empty instance; before
// this they fell through to the FAMILY persona picker (Darrell/Christina/twins),
// which is nonsense for an outside user. This greets them by name and orients
// them instead.
//
// PURELY PRESENTATIONAL: it changes nothing about what data loads, persists, or
// hydrates (the P14 incident area). Worst case if its trigger is off is that the
// panel shows or doesn't — never a data exposure.
import React from 'react';

export default function SelfServeWelcome({ name, onDismiss }) {
  const greetingName = (name && String(name).trim()) ? String(name).trim() : 'friend';
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="ssw-h" className="fixed inset-0 z-50 bg-[#1A1815]/90 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF8F4] border border-[#1A1815] max-w-md w-full p-5 sm:p-6">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-2">PoeTech · Family OS · Welcome</div>
        <h2 id="ssw-h" className="text-xl sm:text-2xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Welcome, {greetingName} — this space is yours.
        </h2>
        <p className="text-sm text-[#1A1815] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          You&apos;ve got your own private workspace. Nothing here is shared with anyone else — it&apos;s your household&apos;s, on infrastructure you control.
        </p>
        <ul className="text-sm text-[#1A1815] mb-4 space-y-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
          <li>📊 <span className="font-semibold">Big Picture</span> — one screen that answers what to do today.</li>
          <li>🏠 <span className="font-semibold">Real Estate, Books, Debts</span> — your numbers, synced across your devices.</li>
          <li>💬 <span className="font-semibold">Feedback</span> — tell us what you need; family voices ship first, and you can attach a screenshot.</li>
        </ul>
        <p className="text-xs text-[#5A5751] mb-4 italic" style={{ fontFamily: '"Fraunces", serif' }}>
          It starts empty on purpose — add what matters to you, and it&apos;s yours to keep, export, or delete.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full bg-[#1A1815] text-white py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
