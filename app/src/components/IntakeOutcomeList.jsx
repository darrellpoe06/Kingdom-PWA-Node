// =============================================================================
// IntakeOutcomeList — what the SENDER sees: each note they sent and its outcome
// (DR-0622, building DR-0621 item 3a)
// =============================================================================
// Darrell 2026-09-24: "so people can feel heard when they're heard and we can
// communicate that but ... i don't want humans to have to communicate that".
// Every sentence on this list is derived — from the note's stored status and
// outcome, the categorizer's basis (lib/intake-outcome.js), the decision
// ledger's own words, or the measured delivery record. Nothing here is typed
// by a person for the occasion.
//
// A reply is the loop closing: "Reply" hands the note back to the form as
// `replyTo`, the new note carries reply_to, and the categorizer sends every
// reply to a person (never the same automatic answer twice).
// =============================================================================
import React from 'react';
import { categorizeIntake, outcomeFor, INTAKE_CATEGORIES } from '../lib/intake-outcome.js';
import { receiptCode, receiptStatus } from '../lib/feedback-receipt.js';

const LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { ok: false, items: [] };
const SERIF = { fontFamily: '"Fraunces", serif' };

const TONE = {
  fixed: 'text-[#5A6E3D]',
  thanks: 'text-[#5A6E3D]',
  decided: 'text-[#2A5A8E]',
  'needs-info': 'text-[#8B6F47]',
  fixing: 'text-[#5A6E3D]',
  working: 'text-[#B85838]',
  'on-board': 'text-[#B85838]',
  known: 'text-[#B85838]',
};

/** The sender's own fix state, read from their note (they never read the queue). */
export function senderFixOf(item) {
  const st = item.triageStatus || item.triage_status || '';
  const ref = String(item.outcomeRef || item.outcome_ref || '');
  const n = parseInt(ref.replace(/\D/g, ''), 10);
  if (st === 'in-progress' && Number.isFinite(n)) return { status: 'opened', prNumber: n };
  if ((item.intakeBasis || item.intake_basis || {}).kind === 'fix-failed') return { status: 'failed' };
  return null;
}

// `board` is every note the device can see. When other people reported the
// same thing, an on-board note says so ("Known issue", N others): the number
// comes from the real clustering (lib/feedback-clusters), never a guess.
export function outcomesOf(notes = [], { delivery = null, ledger = LEDGER, board = null } = {}) {
  return (notes || []).filter(Boolean).map((n) => {
    const cat = categorizeIntake(n, { ledger });
    let out = outcomeFor(n, cat, { delivery, fix: senderFixOf(n) });
    if (out.key === 'on-board' && Array.isArray(board) && board.length > 1) {
      const known = receiptStatus(n, board);
      if (known.key === 'known') out = { ...out, key: 'known', label: known.label, detail: known.detail };
    }
    return { n, cat, out };
  }).filter((x) => x.out.key !== 'signal');
}

export default function IntakeOutcomeList({ notes = [], delivery = null, ledger = LEDGER, board = null, onReply = null, limit = 8 }) {
  const shown = outcomesOf(notes, { delivery, ledger, board });
  if (!shown.length) return null;
  return (
    <div data-testid="intake-outcomes">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1 font-semibold">Your feedback, and where each one stands</div>
      <ul className="divide-y divide-[#E8E4DC] border-t border-[#E8E4DC]">
        {shown.slice(0, limit).map(({ n, cat, out }) => (
          <li key={n.id} className="py-2.5" data-testid="intake-outcome">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] tabular-nums">{receiptCode(n.id)}</span>
              <span className={`text-[0.6875rem] uppercase tracking-wider font-semibold ${TONE[out.key] || 'text-[#5A5751]'}`} data-testid="intake-outcome-label">{out.label}</span>
            </div>
            <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">{INTAKE_CATEGORIES[cat.category]?.label || ''}</p>
            <p className="text-sm text-[#1A1815] mt-0.5" style={SERIF}>{out.detail}</p>
            {out.reason && <p className="text-sm text-[#1A1815] mt-0.5" style={SERIF} data-testid="receipt-reason">Reason: {out.reason}</p>}
            {out.cite && <p className="text-[0.6875rem] text-[#2A5A8E] mt-0.5" data-testid="intake-outcome-cite">From the record: {out.cite}</p>}
            {out.ref && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">Change {out.ref}</p>}
            {out.owner && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">Carried by: {out.owner}</p>}
            {out.window && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" data-testid="intake-outcome-window">{out.window}</p>}
            {onReply && out.replyable && (
              <button type="button" onClick={() => onReply(n)}
                className="mt-1.5 min-h-[44px] px-3 text-xs uppercase tracking-wider border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
                Reply to this
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
