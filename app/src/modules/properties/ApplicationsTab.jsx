// =============================================================================
// ApplicationsTab — who asked to live here, and how we verify them without
// holding an ID (DR-0903 + DR-0945, migrations 0152 + 0272)
// =============================================================================
// TWO ASKS, ONE SURFACE, and they had to arrive together.
//
// Darrell, 2026-10-10: "What happens when you apply!??? End to end
// documentation inside the records for the users!!! Obviously!!!" — and the
// honest answer, measured, was NOTHING. submitApplication has written
// rental_applications rows since 0152 and `grep -rn rental_applications
// app/src` returned that one insert and nothing else: no loader, no tab, no
// badge, no count. The database had permitted the landlord's read the whole
// time; the app simply never asked. Somebody applied for a vacant unit and
// nobody was ever told. A dead letter.
//
// Then, the same evening, after being shown why an applicant's driving license
// is the one document we must not hold: "How can we verify people without
// ID?" and, naming the model himself, "Same as rent a center..."
//
// WHY THEY SHIP TOGETHER. An Applications screen that shows a stranger's
// answers and offers Approve / Decline — and nothing else — is the most
// legally dangerous thing we could build: pure discretion, no record of
// diligence, no evidence the next applicant was treated the same way. The
// corroboration list is not a feature bolted beside the decision. It is the
// thing that makes the decision safe to record at all.
//
// ── THE NO-ID POSTURE, in three enforced layers (none of them is a promise) ─
//   intake.js      marks the social-security and license fields 'out-of-band'
//                  (named there, not here — properties-intake.test.js forbids
//                  the three-letter token in any .jsx in this folder, and an
//                  allow-list for "but mine is only a comment" is how the next
//                  real one gets through)
//   validateApplication  returns them in `refused`, ok:false, if sent
//   0152           CHECK rental_applications_no_ssn refuses the payload
// and 0272 carries the bar onto free text so a phone note is not the back
// door. The reason is not only breach exposure: a photo ID reveals race,
// approximate age and often national origin, so holding one BEFORE a decision
// means a declined applicant can show we possessed protected-class
// information at decision time. Not holding it is the safer posture, both
// ways — which is why screenDecisionReason already refuses a decision
// recorded on any of those terms.
//
// ── WHAT REPLACES IT ───────────────────────────────────────────────────────
// Rent-A-Center runs no credit check: it calls references, takes a utility
// bill proving the address, takes a pay stub, and knows where the person is.
// Corroboration instead of credentials — and a forged license costs about
// eighty dollars, while six people who answer the phone and know your name
// are expensive to fake. An ID proves WHO someone is; it has never predicted
// whether they will pay rent or keep the place.
//
// NOT A SCORE and NOT DISCRETION — see model.js CORROBORATION_ITEMS for why
// both matter, and 0272 for the half that cannot be talked around.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadApplications, loadApplicationChecks, addApplicationCheck, decideApplication,
} from './cloud.js';
import {
  CORROBORATION_ITEMS, CORROBORATION_OUTCOMES, corroborationByItem, corroborationLeft,
  decisionReadyWithChecks, DECISION_REASON_MIN,
} from './model.js';
import { screenDecisionReason } from './intake.js';

const ACCENT = '#2F5D50';
const serif = { fontFamily: '"Fraunces", serif' };
const btn = 'text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40';
const field = 'text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]';

const Head = ({ children }) => (
  <h4 className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold text-[#2F5D50] mt-4 mb-1">{children}</h4>
);

const when = (iso) => {
  if (!iso) return '';
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toLocaleString() : '';
};

// Themeable CLASSES, not inline hex: legibility-guard measures inline text
// color against every surface and #B85838 renders 3.94:1 on midnight/card,
// under the 4.5 floor. It caught this file on its first run.
const OUTCOME_TONE = {
  confirmed: 'text-[#2F5D50]',
  'could-not-reach': 'text-[#5A5751]',
  'did-not-confirm': 'text-[#B85838]',
  'not-applicable': 'text-[#5A5751]',
};

/**
 * One item on the fixed list, with every attempt made on it.
 *
 * The attempts are shown in full rather than reduced to a latest state. 0272
 * grants no UPDATE for the same reason: "called Tuesday, no answer" followed
 * by "called Thursday, reached her" IS the record, and the sequence is the
 * part a deposit dispute or a fair-housing question actually turns on.
 */
function CheckItem({ item, attempts = [], onAdd, busy }) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState('confirmed');
  const [heard, setHeard] = useState('');
  const [err, setErr] = useState('');

  const save = async () => {
    setErr('');
    const r = await onAdd({ item: item.id, outcome, heard });
    if (r && r.ok === false) { setErr(r.message || 'That did not save.'); return; }
    setHeard(''); setOutcome('confirmed'); setOpen(false);
  };

  const done = attempts.length > 0;
  return (
    <li className="border border-[#E8E4DC] bg-white p-2.5" data-testid={`check-${item.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[0.875rem] text-[#1A1815] leading-snug" style={serif}>
            {item.label}
            {!done && (
              <span className="ml-2 text-[0.625rem] uppercase tracking-wider text-[#B85838]"
                data-testid={`check-todo-${item.id}`}>Not checked</span>
            )}
          </div>
          <p className="text-[0.75rem] text-[#5A5751] leading-snug mt-0.5">{item.help}</p>
        </div>
        <button
          type="button" className={`${btn} text-[#2F5D50]`} style={{ borderColor: ACCENT }}
          onClick={() => setOpen((o) => !o)} disabled={busy}
          data-testid={`check-open-${item.id}`}
        >{open ? 'Close' : done ? 'Another attempt' : 'Record'}</button>
      </div>

      {attempts.length > 0 && (
        <ul className="mt-2 border-t border-[#F0EDE6] pt-2 space-y-1.5">
          {attempts.map((a) => (
            <li key={a.id} className="text-[0.75rem] leading-snug" data-testid={`attempt-${item.id}`}>
              <span className={`uppercase tracking-wider text-[0.625rem] ${OUTCOME_TONE[a.outcome] || 'text-[#5A5751]'}`}>
                {(CORROBORATION_OUTCOMES.find((o) => o.id === a.outcome) || {}).label || a.outcome}
              </span>
              <span className="text-[#8A867E]"> · {when(a.checked_at)}</span>
              {a.heard && <div className="text-[#1A1815]">{a.heard}</div>}
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-2 border-t border-[#F0EDE6] pt-2 space-y-2">
          <select
            value={outcome} onChange={(e) => setOutcome(e.target.value)}
            aria-label={`How did the ${item.label} check come back`} className={`${field} text-xs w-full`}
            data-testid={`check-outcome-${item.id}`}
          >
            {CORROBORATION_OUTCOMES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <textarea
            value={heard} onChange={(e) => setHeard(e.target.value)} rows={2}
            placeholder="What were you told? Write what they said, never a Social Security number."
            aria-label={`What you were told for ${item.label}`} className={`${field} text-xs w-full`}
            data-testid={`check-heard-${item.id}`}
          />
          {err && <p className="text-[0.75rem] text-[#B85838]" data-testid={`check-error-${item.id}`}>{err}</p>}
          <button
            type="button" className={`${btn} text-white`} style={{ borderColor: ACCENT, background: ACCENT }}
            onClick={save} disabled={busy} data-testid={`check-save-${item.id}`}
          >Save this attempt</button>
        </div>
      )}
    </li>
  );
}

/** One application: who asked, what they answered, the list, and the decision. */
function ApplicationCard({ app, onChanged }) {
  const [checks, setChecks] = useState([]);
  const [unreadable, setUnreadable] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(app.status === 'submitted' ? 'approved' : app.status);
  const [reason, setReason] = useState(app.decision_reason || '');
  const [said, setSaid] = useState('');
  const [err, setErr] = useState('');

  const reload = useCallback(async () => {
    const r = await loadApplicationChecks(app.id);
    setChecks((r && r.checks) || []);
    setUnreadable((r && r.unreadable) || []);
  }, [app.id]);

  useEffect(() => { reload(); }, [reload]);

  const byItem = useMemo(() => corroborationByItem(checks), [checks]);
  const left = useMemo(() => corroborationLeft(checks), [checks]);

  const addCheck = async ({ item, outcome, heard }) => {
    setBusy(true);
    try {
      const r = await addApplicationCheck({
        applicationId: app.id, instanceId: app.instance_id, item, outcome, heard,
      });
      if (!r || r.ok === false) {
        // cloud.js's no() folds an explanatory {message} into `.error` — read
        // both, or the person meets a useless "that did not save" in place of
        // the sentence that tells them what to do. Caught by the behavioral
        // gate; a source-grep test would never have seen it.
        return { ok: false, message: (r && (r.message || r.error)) || 'That did not save. Nothing was recorded.' };
      }
      await reload();
      return { ok: true };
    } finally { setBusy(false); }
  };

  // The fair-housing guard runs BEFORE the save, on what he is typing. 0272
  // cannot catch this one — the database has no opinion about prose — so the
  // refusal has to live here, and it names the term rather than hinting.
  const fair = reason.trim() ? screenDecisionReason(reason) : { ok: true };
  const gate = decisionReadyWithChecks(status, reason, checks);
  const decided = app.status === 'approved' || app.status === 'declined';

  const decide = async () => {
    setErr(''); setSaid('');
    if (!fair.ok) { setErr(fair.message); return; }
    setBusy(true);
    try {
      const r = await decideApplication(app.id, status, reason, undefined, checks);
      if (!r || r.ok === false) {
        setErr((r && (r.message || r.error)) || 'That decision did not save.');
        return;
      }
      setSaid(`Recorded: ${status}, at ${new Date().toLocaleString()}.`);
      if (onChanged) onChanged();
    } finally { setBusy(false); }
  };

  const answers = app.answers && typeof app.answers === 'object' ? app.answers : {};
  const answerRows = Object.entries(answers).filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '');

  return (
    <li className="border border-[#E8E4DC] bg-[#FAF8F4] p-3" data-testid="application-card">
      <div className="text-[1rem] text-[#1A1815]" style={serif} data-testid="application-name">
        {app.applicant_name || 'Someone'}
      </div>
      <div className="text-[0.75rem] text-[#5A5751]">
        asked {when(app.created_at)}
        {app.applicant_phone ? ` · ${app.applicant_phone}` : ''}
        {app.applicant_email ? ` · ${app.applicant_email}` : ''}
      </div>
      <div className={`text-[0.75rem] mt-0.5 ${decided ? 'text-[#2F5D50]' : 'text-[#5A5751]'}`} data-testid="application-status">
        {app.status}
        {app.decided_at ? ` · decided ${when(app.decided_at)}` : ''}
      </div>

      {answerRows.length > 0 && (
        <>
          <Head>What they answered</Head>
          <dl className="text-[0.75rem] text-[#1A1815] space-y-0.5">
            {answerRows.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="text-[#8A867E] shrink-0">{k.split('.').pop()}</dt>
                <dd className="min-w-0 break-words">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <Head>Checking them out</Head>
      <p className="text-[0.75rem] text-[#5A5751] leading-snug">
        The same list for everyone, which is what makes it fair — and what makes it
        hold up if a decision is ever questioned. &ldquo;Could not reach&rdquo; and
        &ldquo;does not apply&rdquo; are both answers; a blank is not. We never ask for
        a Social Security number or a photo ID.
      </p>
      {unreadable.length > 0 && (
        /* DR-0876: an empty list from RLS and an empty list from reality look
           identical from here, and a landlord must not start ringing people a
           second time because of it. */
        <p className="text-[0.75rem] mt-1 text-[#B85838]" data-testid="checks-unreadable">
          These checks could not be read with your access, so this list may be incomplete.
        </p>
      )}
      <ul className="mt-2 space-y-1.5">
        {CORROBORATION_ITEMS.map((item) => (
          <CheckItem
            key={item.id} item={item} attempts={byItem.get(item.id) || []}
            onAdd={addCheck} busy={busy}
          />
        ))}
      </ul>

      <Head>Your decision</Head>
      {left.length > 0 && (
        <p className="text-[0.75rem] mb-1 text-[#B85838]" data-testid="decision-blocked">
          {gate.why}
        </p>
      )}
      <div className="space-y-2">
        <select
          value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Decision"
          className={`${field} text-xs w-full`} data-testid="decision-status"
        >
          <option value="reviewing">Still reviewing</option>
          <option value="approved">Approve</option>
          <option value="declined">Decline</option>
          <option value="withdrawn">They withdrew</option>
        </select>
        <textarea
          value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
          placeholder={`Which criterion does this rest on? At least ${DECISION_REASON_MIN} characters — income, references, payment history, or the background answers.`}
          aria-label="Why" className={`${field} text-xs w-full`} data-testid="decision-reason"
        />
        {!fair.ok && (
          <p className="text-[0.75rem] text-[#B85838]" data-testid="decision-fair-housing">{fair.message}</p>
        )}
        {err && <p className="text-[0.75rem] text-[#B85838]" data-testid="decision-error">{err}</p>}
        {said && <p className="text-[0.75rem] text-[#2F5D50]" data-testid="decision-said">{said}</p>}
        <button
          type="button" className={`${btn} text-white`} style={{ borderColor: ACCENT, background: ACCENT }}
          onClick={decide} disabled={busy || !gate.ok || !fair.ok} data-testid="decision-save"
        >Record this decision</button>
      </div>
    </li>
  );
}

/**
 * The tab. `rentalId` scopes it to the door whose header is above it, the way
 * every other door-scoped tab here reads one door.
 */
export default function ApplicationsTab({ rentalId = null, doorName = 'this door' }) {
  const [apps, setApps] = useState([]);
  const [unreadable, setUnreadable] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await loadApplications({ rentalId });
      setApps((r && r.applications) || []);
      setUnreadable((r && r.unreadable) || []);
    } finally { setLoading(false); }
  }, [rentalId]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) {
    return <p className="text-[0.75rem] text-[#5A5751]" data-testid="applications-loading">Looking…</p>;
  }

  return (
    <div data-testid="applications-tab">
      {unreadable.length > 0 && (
        /* Never "nobody has applied" when the truth is "you may not see them"
           (DR-0876). RLS withholds by returning nothing, not by erroring. */
        <p className="text-[0.75rem] mb-2 text-[#B85838]" data-testid="applications-unreadable">
          Applications could not be read with your access. This is not the same as there being none.
        </p>
      )}
      {apps.length === 0 && unreadable.length === 0 && (
        <p className="text-[0.75rem] text-[#5A5751]" data-testid="applications-empty">
          Nobody has applied for {doorName} yet.
        </p>
      )}
      <ul className="space-y-3">
        {apps.map((a) => <ApplicationCard key={a.id} app={a} onChanged={reload} />)}
      </ul>
    </div>
  );
}
