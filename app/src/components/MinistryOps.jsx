// =============================================================================
// MinistryOps — the internal weekly-operations workspace (Projects sub-tab), and
// the curated member digest it publishes (Darrell 2026-07-13).
// =============================================================================
// Staff (owner/admin) run the weekly operation of the ministries here as real ops
// items; any item they mark "Show members" becomes the paid ($39.99 / poetech-
// plus) subscriber's content. Self-contained (subscribes + resolves access via
// ministry-ops-sync); RLS is the real gate — a non-staff member only ever
// fetches member-visible rows.
//
// PHASE 1 (this): the staff workspace + the publish flag + a live preview of the
// member digest. PHASE 2 (staged): the poetech-plus subscriber surface that
// renders this digest, and members' own project boards.
//
// A11y: white cards, #1A1815 body / #5A5751 secondary, labelled inputs, visible
// #B85838 focus outline.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { onAuthChange } from '../lib/supabase.js';
import {
  getOpsAccess, subscribeOps, saveOpsItem, removeOpsItem, setOpsStatus, setMemberVisible,
  groupByWeek, memberDigest, opsProgress, weekOf,
  OPS_STATUS, opsStatusLabel, OPS_MINISTRIES, opsMinistryLabel,
} from '../lib/ministry-ops-sync.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const CARD = 'border border-[#E8E4DC] bg-white p-3';

const todayIso = () => { try { return new Date().toISOString().slice(0, 10); } catch { return '2026-01-01'; } };
const fmtWeek = (w) => { if (!w || w === 'undated') return 'No week set'; try { return `Week of ${new Date(w + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`; } catch { return w; } };

const STATUS_BORDER = {
  done: 'border-[#5A6E3D] text-[#5A6E3D]',
  'in-progress': 'border-[#B85838] text-[#B85838]',
  blocked: 'border-[#991B1B] text-[#991B1B]',
  todo: 'border-[#C9BFA8] text-[#5A5751]',
};

export default function MinistryOps() {
  const [signedIn, setSignedIn] = useState(false);
  const [access, setAccess] = useState({ signedIn: false, canManage: false });
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [form, setForm] = useState(null);

  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);
  useEffect(() => {
    if (!signedIn) { setAccess({ signedIn: false, canManage: false }); return undefined; }
    let alive = true;
    getOpsAccess().then((a) => { if (alive) setAccess(a); });
    return () => { alive = false; };
  }, [signedIn]);
  useEffect(() => {
    if (!signedIn) { setItems([]); return undefined; }
    return subscribeOps(setItems);
  }, [signedIn]);

  const reportSkip = (r) => { if (r && r.skipped) setErr(`Could not save (${r.skipped}). Try again.`); else setErr(''); };
  const weeks = useMemo(() => groupByWeek(items), [items]);
  const digest = useMemo(() => memberDigest(items), [items]);
  const progress = useMemo(() => opsProgress(items), [items]);

  const submit = async () => {
    if (!form.title.trim()) return;
    const r = await saveOpsItem(form);
    reportSkip(r);
    if (r?.saved) setForm(null);
  };

  if (!signedIn) return <p className="text-sm text-[#5A5751] p-2">Sign in to see Ministry Ops.</p>;

  // Non-staff member: the curated digest only (the $39.99 content, read-only).
  if (!access.canManage) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[#1A1815]">What the ministries are building</h3>
        <p className="text-xs text-[#5A5751]">A members' window into the weekly work across the ministries. "Let all things be done decently and in order" (1 Corinthians 14:40).</p>
        <MemberDigest digest={digest} />
      </div>
    );
  }

  // Staff workspace.
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-[#1A1815]">Ministry Ops · weekly operations</h3>
        <span className="text-xs text-[#5A5751]">{progress.done}/{progress.total} done · {progress.blocked} blocked</span>
      </div>
      {err && <p className="text-xs text-[#991B1B]" role="alert">{err}</p>}

      {form ? (
        <div className={`${CARD} space-y-2`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block"><span className={LABEL}>Ministry</span>
              <select value={form.ministry} onChange={(e) => setForm({ ...form, ministry: e.target.value })} className={FIELD}>
                {OPS_MINISTRIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
            <label className="block"><span className={LABEL}>Week of</span><input type="date" value={form.weekOf} onChange={(e) => setForm({ ...form, weekOf: e.target.value })} className={FIELD} /></label>
          </div>
          <label className="block"><span className={LABEL}>What needs doing</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={FIELD} placeholder="Confirm Sunday drivers, order choir music…" /></label>
          <label className="block"><span className={LABEL}>Detail (optional)</span><textarea value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} rows={2} className={FIELD} /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block"><span className={LABEL}>Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={FIELD}>
                {OPS_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-[#1A1815] mt-5"><input type="checkbox" checked={!!form.memberVisible} onChange={(e) => setForm({ ...form, memberVisible: e.target.checked })} /> Show members ($39.99 content)</label>
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={submit} className={`${BTN} bg-[#B85838] text-white`}>Save</button>
            <button type="button" onClick={() => setForm(null)} className={`${BTN} text-[#5A5751]`}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setForm({ ministry: 'general', title: '', detail: '', status: 'todo', weekOf: weekOf(todayIso()), memberVisible: false })} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>+ Add ops item</button>
      )}

      {weeks.length === 0 && <p className="text-sm text-[#5A5751]">No ops items yet. Add the ministries' weekly work above.</p>}
      {weeks.map((w) => (
        <div key={w.week} className="space-y-2">
          <h4 className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">{fmtWeek(w.week)}</h4>
          {w.items.map((it) => (
            <div key={it.id} className={`${CARD} space-y-1`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-[#1A1815]">{it.title}</span>
                <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border ${STATUS_BORDER[it.status] || STATUS_BORDER.todo}`}>{opsStatusLabel(it.status)}</span>
              </div>
              <div className="text-[0.625rem] text-[#5A5751]">{opsMinistryLabel(it.ministry)}{it.memberVisible ? ' · shown to members' : ''}</div>
              {it.detail && <div className="text-xs text-[#5A5751]">{it.detail}</div>}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <select value={it.status} onChange={async (e) => reportSkip(await setOpsStatus(it.id, e.target.value))} className="text-xs border border-[#E8E4DC] bg-white p-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
                  {OPS_STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
                <button type="button" onClick={async () => reportSkip(await setMemberVisible(it.id, !it.memberVisible))} className={`${BTN} ${it.memberVisible ? 'text-[#5A6E3D]' : 'text-[#B85838]'} hover:text-[#1A1815]`}>{it.memberVisible ? 'Hide from members' : 'Show members'}</button>
                <button type="button" onClick={async () => reportSkip(await removeOpsItem(it.id))} className={`${BTN} text-[#991B1B] hover:underline`}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Live preview of the paid members' content — exactly what a subscriber sees. */}
      <div className="pt-3 border-t border-[#E8E4DC]">
        <h4 className="text-sm font-medium text-[#1A1815] mb-1">Members' view (preview)</h4>
        <p className="text-xs text-[#5A5751] mb-2">This is the $39.99 members' "content context" — only items you marked "Show members." The subscriber surface (Phase 2) renders exactly this.</p>
        <MemberDigest digest={digest} />
      </div>
    </div>
  );
}

function MemberDigest({ digest }) {
  if (!digest || digest.length === 0) return <p className="text-sm text-[#5A5751]">Nothing published yet — check back soon.</p>;
  return (
    <div className="space-y-3">
      {digest.map((g) => (
        <div key={g.ministry} className={`${CARD} space-y-1`}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-[#1A1815]">{g.ministryLabel}</span>
            <span className="text-[0.625rem] text-[#5A6E3D]">{g.done} shipped</span>
          </div>
          <ul className="space-y-1">
            {g.items.map((it) => (
              <li key={it.id} className="text-xs text-[#5A5751] flex items-baseline gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 ${it.status === 'done' ? 'bg-[#5A6E3D]' : 'bg-[#5A5751]'}`} aria-hidden="true" />
                <span className="text-[#1A1815]">{it.title}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
