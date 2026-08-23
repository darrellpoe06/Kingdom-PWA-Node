// =============================================================================
// MemberInspect — the per-member stewardship panel (position · status ·
// satisfaction · qualitative notes), mounted from the Admin members list.
// =============================================================================
// Darrell 2026-07-27: "edit each member of the app position and inspect them
// to be sure of their services and status so qualitative information can help
// us keep track of satisfaction." Reads/writes the REAL member_stewardship
// rows (0122, leader-only RLS). The newest row is the member's current
// position/status; the history is the satisfaction track, with the trend
// computed only from real reads (never fabricated from one point, DR-0076).
// QUALITY-OF-LIFE: a mirror for care — the trend exists so a steward notices
// drift toward hurting BEFORE the person disappears.
import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabase.js';
import {
  MEMBER_STATUSES, SATISFACTION_LEVELS, latestByMember, satisfactionTrend,
} from '../lib/member-inspect.js';
import { loadObservations, addObservation, loadMemberFeedback } from '../lib/member-inspect-sync.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';

const TREND_LABEL = {
  improving: { text: 'Improving', cls: 'text-[#5A6E3D]' },
  steady: { text: 'Steady', cls: 'text-[#5A5751]' },
  declining: { text: 'Declining — reach out', cls: 'text-[#B85838]' },
};

const fmtDay = (iso) => {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch { return ''; }
};

export default function MemberInspect({ instanceId, member }) {
  const [recordedBy, setRecordedBy] = useState(null);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('active');
  const [form, setForm] = useState({ position: '', satisfaction: '', note: '' });
  const [msg, setMsg] = useState('');
  const [theirWords, setTheirWords] = useState([]); // their recent feedback (0122's mirror, both directions)

  const refresh = () => loadObservations(instanceId).then((r) => {
    if (!r.ok) { setMsg(r.reason === 'no-instance' ? '' : `Could not load the record (${r.reason}).`); return; }
    const mine = r.rows.filter((o) => o.member_user_id === member.userId);
    setRows(mine);
    const current = latestByMember(mine).get(member.userId);
    if (current) {
      setStatus(current.status || 'active');
      setForm((f) => ({ ...f, position: f.position || current.position || '' }));
    }
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setRecordedBy(data?.user?.id || null)).catch(() => {});
    refresh();
    loadMemberFeedback(member.userId).then((r) => { if (r.ok) setTheirWords(r.rows); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, member.userId]);

  const save = async () => {
    setMsg('Saving…');
    const r = await addObservation({
      instanceId, memberUserId: member.userId, recordedBy,
      position: form.position, status, satisfaction: form.satisfaction || null, note: form.note,
    });
    if (!r.ok) { setMsg(r.reason === 'empty-observation' ? 'Write something first — a position, a read, or a note.' : `Not saved (${r.reason}).`); return; }
    setForm((f) => ({ ...f, satisfaction: '', note: '' }));
    setMsg('Recorded.');
    refresh();
  };

  const trend = satisfactionTrend(rows);
  const trendUi = trend ? TREND_LABEL[trend] : null;

  return (
    <div className="mt-2 border border-[#E8E4DC] bg-[#FAF8F4] p-3 space-y-2 text-left">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">
          Stewardship record — {member.displayName || member.email || 'member'}
        </span>
        {trendUi
          ? <span className={`text-[0.625rem] uppercase tracking-wider font-semibold ${trendUi.cls}`}>{trendUi.text}</span>
          : <span className="text-[0.625rem] text-[#5A5751]">No trend yet — needs two satisfaction reads</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label className="block">
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Position / service</span>
          <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            className={FIELD} placeholder="Usher lead · Sound · Kitchen…" />
        </label>
        <label className="block">
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={FIELD}>
            {MEMBER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">How are they, really</span>
          <select value={form.satisfaction} onChange={(e) => setForm((f) => ({ ...f, satisfaction: e.target.value }))} className={FIELD}>
            <option value="">— no read this time —</option>
            {SATISFACTION_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Qualitative note (what you saw, heard, know)</span>
        <textarea rows={2} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className={FIELD} placeholder="Served both services, seemed tired; mentioned work stress…" />
      </label>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[#1A1815]" role="status">{msg}</span>
        <button type="button" onClick={save} className={`${BTN} bg-[#B85838] text-white`}>Record observation</button>
      </div>
      {rows.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-[#E8E4DC]">
          {rows.slice(0, 6).map((o) => (
            <div key={o.id} className="text-xs text-[#1A1815]">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mr-2">{fmtDay(o.created_at)}</span>
              {[o.position, o.status, o.satisfaction].filter(Boolean).join(' · ')}
              {o.note ? <span className="text-[#5A5751]"> — {o.note}</span> : null}
            </div>
          ))}
        </div>
      )}
      {/* The mirror runs BOTH ways (Darrell 2026-08-23: "requests and
          feedback..."): under what you observe, what THEY have said — their
          real feedback rows, confidential ones badged, never hidden. */}
      {theirWords.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-[#E8E4DC]">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">In their own words — recent feedback</div>
          {theirWords.map((f) => (
            <div key={f.id} className="text-xs text-[#1A1815]">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mr-2">{fmtDay(f.submitted_at)}</span>
              {[f.which_tab, f.sentiment].filter(Boolean).join(' · ')}
              {f.is_confidential ? <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] ml-1">confidential</span> : null}
              <span className="text-[#5A5751]"> — {String(f.feedback_text || '').slice(0, 160)}{String(f.feedback_text || '').length > 160 ? '…' : ''}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[0.625rem] text-[#5A5751]">
        Observations are append-only and leader-only — a mirror held for care, never a score.
      </p>
    </div>
  );
}
