// 1099 Contractors — extracted from monolith (r25) and rebuilt with inline edit
// per EDITABLE-EVERYWHERE.md + IDENTITY-ROLES-AUDIT.md. The original was a
// read-only one-liner; this version supports Add / Edit / Delete with
// lifecycle log entries written on every save.
//
// WORKER MANAGER + WORKER VOICE (2026-07-05, Darrell: "we need the system to
// be our 1099 workers managers and also hear their perspectives on
// operations"). Two additions, both on existing rails:
//   - Manager state per outbound worker: their open work orders (from the
//     OPTIONAL `incidents` prop — the shell mount doesn't pass it yet, so an
//     honest note shows until it does; nothing is painted), YTD paid (already
//     real), and one-tap follow-up (tel:/sms:/mailto: from the real contact).
//   - Worker voice: the family records what a worker said about the operation
//     after a job. It ships through the EXISTING feedback rail
//     (uploadFeedback, tagged 'worker-ops') so it lands in the live
//     cross-device stream and the Concerns board read-through. Recent entries
//     render below via subscribeFeedback — the same self-subscribe pattern
//     Engagement's MessageThread proves out.
import React, { useEffect, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import SectionTabs from './SectionTabs.jsx';
import { smsHref } from '../lib/dispatch.js';
import { uploadFeedback, subscribeFeedback } from '../lib/feedback-sync.js';
import { onAuthChange } from '../lib/supabase.js';
import {
  WORKER_VOICE_AREA, workerOpenIncidents, buildFollowUpMessage,
  buildWorkerVoiceRecord, isWorkerVoice, voiceEntries,
} from '../lib/worker-ops.js';
import {
  WORKER_KINDS, necThresholdLabel, classificationAdvisory,
} from '../lib/worker-classification.js';
import { setFullTaxId, hasFullTaxId, maskedLabel, vaultCount, exportForBackup, importFromBackup } from '../lib/tax-id-vault.js';
import { effectiveYtdPaid } from '../lib/contractor-ytd.js';

// tone -> foreground color for the classification/threshold notes. Uses the
// house palette; true red is reserved (Color Theology) so 'warn' uses the
// coral accent, not red.
const TONE_COLOR = { warn: '#B85838', due: '#B85838', caution: '#8A6D3B', ok: '#5A5751' };

const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

// Real timestamp, human-readable. Unparseable input renders as-is (honest)
// rather than inventing a date.
const fmtWhen = (iso) => {
  const t = Date.parse(iso || '');
  return Number.isNaN(t) ? (iso || '') : new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Union vocab with the contractors_1099 status CHECK (v2.13) — the app's
// values and the schema's lifecycle states are both real; nothing flattens.
const CONTRACTOR_STATUSES = ['active', 'pipeline', 'possible', 'paused', 'inactive', 'ended', 'terminated'];

// contractor = someone you hire to do work; vendor = someone you buy goods /
// supplies from. The work-order dispatch defaults each assigned worker's type
// from this, so the crew on a job reads right (who's labor, who's supply).
const CONTRACTOR_TYPES = ['contractor', 'vendor'];

// The honest, plain-language note for a chosen relationship kind: the tax
// advisory (household -> may be an EMPLOYEE; clergy -> dual status; etc.) plus,
// for outbound, the 1099-NEC threshold read from the real YTD-paid. Text uses
// REM font sizes on purpose (consistency guard freezes this file's fixed-px
// count; new text must scale with the large-print control).
function ClassificationNote({ kind, ytdPaid, direction, year }) {
  const a = classificationAdvisory(kind, { ytdPaid, year });
  const thr = direction === 'outbound' ? necThresholdLabel(ytdPaid, year) : null;
  return (
    <div className="mt-1 space-y-1">
      <div className="text-[0.6875rem] leading-snug" style={{ color: TONE_COLOR[a.tone] || '#5A5751', fontFamily: '"Fraunces", serif' }}>
        {a.tone === 'warn' ? 'Caution — ' : ''}{a.headline}
      </div>
      <div className="text-[0.625rem] text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{a.detail}</div>
      {thr && (
        <div className="text-[0.625rem] leading-snug" style={{ color: TONE_COLOR[thr.tone] || '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>{thr.text}</div>
      )}
    </div>
  );
}

// Tax-identity inputs — the fields a 1099 actually needs. SOVEREIGN: the full
// SSN/EIN typed here is written to the on-device vault on save (never to the
// record, never to the cloud); only the last 4 + type + W-9 flag persist. Shown
// with rem fonts on purpose (this file's fixed-px count is frozen by the
// consistency guard). `bg` matches the surrounding form (add vs edit).
function TaxIdentityFields({ form, setForm, bg, contractorId }) {
  const onDevice = contractorId ? hasFullTaxId(contractorId) : false;
  return (
    <div className="border border-dashed border-[#E8E4DC] p-2 space-y-2">
      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Tax identity (for the 1099) — the full ID stays on THIS device only, never the cloud</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Legal name (as on the W-9)</label><input className={`w-full p-2 border border-[#E8E4DC] text-sm ${bg}`} placeholder="Legal / business name" value={form.legalName || ''} onChange={e => setForm({ ...form, legalName: e.target.value })} /></div>
        <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Mailing address</label><input className={`w-full p-2 border border-[#E8E4DC] text-sm ${bg}`} placeholder="Street, city, state, ZIP" value={form.mailingAddress || ''} onChange={e => setForm({ ...form, mailingAddress: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">ID type</label>
          <select className={`w-full p-2 border border-[#E8E4DC] text-sm ${bg}`} value={form.taxIdType || 'ein'} onChange={e => setForm({ ...form, taxIdType: e.target.value })}><option value="ein">EIN (business)</option><option value="ssn">SSN (individual)</option></select>
        </div>
        <div>
          <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Taxpayer ID {form.taxIdLast4 ? `(on file: ····${form.taxIdLast4}${onDevice ? '' : ' — last-4 only on this device'})` : ''}</label>
          <input type="password" inputMode="numeric" autoComplete="off" className={`w-full p-2 border border-[#E8E4DC] text-sm ${bg}`} placeholder={form.taxIdLast4 ? 'Re-enter to change' : 'Full SSN/EIN — saved to this device only'} value={form.taxIdFull || ''} onChange={e => setForm({ ...form, taxIdFull: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[0.625rem] text-[#5A5751]">
        <input type="checkbox" checked={!!form.w9OnFile} onChange={e => setForm({ ...form, w9OnFile: e.target.checked })} />
        W-9 collected and on file
      </label>
    </div>
  );
}

// Tax-ID vault backup — the FULL taxpayer ids live only on this device
// (tax-id-vault.js). This is the ONLY sanctioned way they leave it: export a
// JSON file the family saves to their OWN NAS, and import it back on another
// device. Never a cloud round-trip. Rem fonts + themeable classes on purpose
// (consistency + legibility guards). Export/import are user-gesture only.
function TaxIdVaultBackup() {
  const [msg, setMsg] = useState('');
  const count = vaultCount();
  const doExport = () => {
    try {
      const data = JSON.stringify(exportForBackup(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'poe-tax-ids-backup.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMsg(`Exported ${count} taxpayer ID${count === 1 ? '' : 's'}. Save this file to your NAS — it holds the full IDs, so keep it on hardware you own.`);
    } catch { setMsg('Could not export on this device.'); }
  };
  const doImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const added = importFromBackup(JSON.parse(String(e.target.result || '{}')));
        setMsg(`Restored ${added} taxpayer ID${added === 1 ? '' : 's'} to this device from the backup.`);
      } catch { setMsg('That file was not a readable vault backup.'); }
    };
    reader.onerror = () => setMsg('Could not read that file.');
    reader.readAsText(file);
  };
  return (
    <div className="border border-dashed border-[#E8E4DC] p-3 space-y-2">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Taxpayer-ID backup · {count} full ID{count === 1 ? '' : 's'} on this device</div>
      <div className="text-[0.625rem] text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>
        Full SSN/EIN numbers are stored ONLY on this device — never in the cloud. Export them to a file and save it to your NAS so they survive a lost phone and reach your other devices. Nothing here is uploaded.
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" onClick={doExport} disabled={count === 0} className="text-[0.625rem] uppercase tracking-wider text-[#1A1815] border border-[#1A1815] px-3 py-1.5 hover:bg-[#1A1815] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Export to file (for NAS)</button>
        <label className="text-[0.625rem] uppercase tracking-wider text-[#1A1815] border border-[#1A1815] px-3 py-1.5 hover:bg-[#1A1815] hover:text-white cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-[#B85838]">
          Import from NAS file
          <input type="file" accept="application/json,.json" className="hidden" onChange={e => doImport(e.target.files && e.target.files[0])} />
        </label>
      </div>
      {msg && <div className="text-[0.625rem] text-[#5A6E3D] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>{msg}</div>}
    </div>
  );
}

const BLANK_CONTRACTOR = {
  direction: 'outbound',
  entityId: 'e-personal',
  type: 'contractor',
  // kind = the 1099 relationship classification (worker-classification.js).
  // Drives the tax advisory + the safe-access default (isolation for all,
  // finance-read only for the tax accountant).
  kind: 'business',
  name: '',
  role: '',
  // Phone is what makes one-tap dispatch work (DispatchPanel texts the job
  // to this number); email is the fallback contact.
  phone: '',
  email: '',
  ytdPaid: 0,
  ytdReceived: 0,
  monthly: 0,
  monthlyExpected: 0,
  status: 'active',
  notes: '',
  // Tax identity — what the 1099 needs. The full SSN/EIN is NEVER put on the
  // record (and so never synced): `taxIdFull` is a transient form field, written
  // to the on-device vault on save; only `taxIdLast4` (+ type + w9OnFile) persist.
  legalName: '',
  mailingAddress: '',
  taxIdType: 'ein',
  taxIdFull: '',
  taxIdLast4: '',
  w9OnFile: false,
};

function ContractorRow({ c, isLast, entities, onEdit, onDelete, editing, editForm, setEditForm, onSave, onCancel, openWork, taxYear, transactions }) {
  const value = c.direction === 'outbound' ? c.ytdPaid : c.ytdReceived;
  const rateLabel = c.direction === 'outbound' ? 'YTD paid' : `YTD received · ${fmt(c.monthlyExpected)}/mo expected`;
  return (
    <div className={`p-4 ${!isLast ? 'border-b border-[#E8E4DC]' : ''}`}>
      <div className="flex justify-between items-baseline gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{c.name}</div>
          <div className="text-xs text-[#5A5751]">{c.type === 'vendor' ? 'vendor' : 'contractor'}{c.role ? ` · ${c.role}` : ''}{c.status && c.status !== 'active' ? ` · ${c.status}` : ''}</div>
          {(c.phone || c.email) && (
            <div className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="hover:text-[#1A1815] underline">{c.phone}</a>}
              {c.phone && <> · <a href={smsHref(c.phone)} aria-label={`Text ${c.name}`} className="hover:text-[#1A1815] underline">text</a></>}
              {c.phone && c.email && ' · '}
              {c.email && <a href={`mailto:${c.email}`} className="hover:text-[#1A1815] underline">{c.email}</a>}
            </div>
          )}
          {c.notes && <div className="text-[11px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{c.notes}</div>}
          {/* Classification read on the collapsed card: the kind tag, plus (for
              outbound) the 1099-NEC threshold flag from the REAL YTD paid, plus
              the safety WARNING headline when one applies (household -> may be an
              employee; clergy -> dual status) so it is visible without editing.
              rem sizes keep the consistency-guard px baseline frozen. */}
          {(() => {
            const kindLabel = (WORKER_KINDS.find(k => k.id === (c.kind || 'business')) || WORKER_KINDS[0]).label;
            // YTD-paid for the threshold: the LEDGER-derived amount when real
            // payments match this contractor (interconnectedness — REV-0106
            // finding), else the typed value. So the 1099 line reads off actual
            // money movement, not a hand-typed guess.
            const eff = effectiveYtdPaid(c, transactions || [], taxYear);
            const adv = classificationAdvisory(c.kind || 'business', { ytdPaid: eff.value, year: taxYear });
            const thr = c.direction === 'outbound' ? necThresholdLabel(eff.value, taxYear) : null;
            return (
              <div className="mt-1 space-y-0.5">
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{kindLabel}</div>
                {adv.tone === 'warn' && (
                  <div className="text-[0.625rem] leading-snug" style={{ color: TONE_COLOR.warn, fontFamily: '"Fraunces", serif' }}>Caution — {adv.headline}</div>
                )}
                {thr && thr.tone !== 'ok' && (
                  <div className="text-[0.625rem] leading-snug" style={{ color: TONE_COLOR[thr.tone] || '#5A5751', fontFamily: '"JetBrains Mono", monospace' }}>{thr.text}</div>
                )}
                {c.direction === 'outbound' && eff.source === 'ledger' && (
                  <div className="text-[0.625rem] leading-snug text-[#5A6E3D]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>Ledger: {fmt(eff.value)} from {eff.derived.count} payment{eff.derived.count === 1 ? '' : 's'} in {taxYear}{eff.typed && Math.abs(eff.typed - eff.value) >= 1 ? ` (typed ${fmt(eff.typed)})` : ''}</div>
                )}
                {/* Tax identity: the masked ID (never the full number) + a W-9-needed
                    flag when a 1099 is due (threshold crossed) but no W-9 is on file. */}
                {c.direction === 'outbound' && (c.taxIdLast4 || c.w9OnFile || (thr && thr.tone === 'due')) && (() => {
                  const needsW9 = thr && thr.tone === 'due' && !c.w9OnFile;
                  // Default color from a THEMEABLE class (text-[#5A5751] remaps in
                  // dark theme); inline color ONLY for the coral warn (passes AA).
                  return (
                    <div className={`text-[0.625rem] leading-snug ${needsW9 ? '' : 'text-[#5A5751]'}`} style={needsW9 ? { color: TONE_COLOR.warn, fontFamily: '"JetBrains Mono", monospace' } : { fontFamily: '"JetBrains Mono", monospace' }}>
                      {c.taxIdLast4 ? maskedLabel(c.taxIdType, c.taxIdLast4) : 'No taxpayer ID on file'}
                      {c.w9OnFile ? ' · W-9 on file' : (thr && thr.tone === 'due' ? ' · W-9 NEEDED to file' : ' · no W-9 yet')}
                    </div>
                  );
                })()}
              </div>
            );
          })()}
          {/* Manager state: this worker's open work orders. Renders ONLY when the
              shell provides incidents (openWork is an array) — never painted. The
              assignment slice is theirs, so "their piece done, order still open"
              reads as exactly that. rem sizes on purpose: the consistency guard
              freezes this file's fixed-px count at its baseline. */}
          {c.direction === 'outbound' && Array.isArray(openWork) && (
            <div className="mt-2 pt-2 border-t border-dashed border-[#E8E4DC]">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Open work orders · {openWork.length}</div>
              {openWork.length === 0 ? (
                <div className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>None open right now.</div>
              ) : openWork.map(({ incident, assignment }) => (
                <div key={assignment.id || incident.id} className="flex items-baseline justify-between gap-2 flex-wrap mt-1">
                  <div className="text-[0.6875rem] text-[#1A1815] min-w-0">
                    {incident.description || 'Work order'}
                    <span className="text-[#5A5751]">
                      {incident.dueDate ? ` · due ${incident.dueDate}` : ''}
                      {assignment.status === 'done'
                        ? ` · their piece done ✓${assignment.doneAt ? ` ${String(assignment.doneAt).slice(0, 10)}` : ''} (order still open)`
                        : (assignment.dispatchedAt ? ` · dispatched ${String(assignment.dispatchedAt).slice(0, 10)}` : ' · assigned')}
                    </span>
                  </div>
                  {c.phone && assignment.status !== 'done' && (
                    <a href={smsHref(c.phone, buildFollowUpMessage(incident))} className="shrink-0 text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline">Text about this job</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(value)}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{rateLabel}</div>
        </div>
      </div>
      <div className="flex gap-1 mt-2">
        <button
          type="button"
          onClick={() => editing ? onCancel() : onEdit(c)}
          aria-expanded={editing}
          aria-label={editing ? `Cancel edit for ${c.name}` : `Edit ${c.name}`}
          className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          {editing ? '× Cancel' : '✎ Edit'}
        </button>
        <button
          type="button"
          onClick={() => { if (window.confirm(`Delete ${c.name}? This removes the YTD totals — make sure they're already captured in Books.`)) onDelete(c.id); }}
          aria-label={`Delete ${c.name}`}
          className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          Delete
        </button>
      </div>
      {editing && (
        <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {c.name}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Name</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Role</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} /></div>
          </div>
          <div>
            <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Relationship kind — sets the tax note + access default</label>
            <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.kind || 'business'} onChange={e => setEditForm({ ...editForm, kind: e.target.value })}>{WORKER_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
            <ClassificationNote kind={editForm.kind || 'business'} ytdPaid={editForm.ytdPaid} direction={editForm.direction} year={taxYear} />
            <TaxIdentityFields form={editForm} setForm={setEditForm} bg="bg-white" contractorId={c.id} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Phone (for one-tap dispatch)</label><input type="tel" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" placeholder="e.g., 217-555-0142" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Email</label><input type="email" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Type</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>{CONTRACTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Direction</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.direction} onChange={e => setEditForm({ ...editForm, direction: e.target.value })}><option value="outbound">outbound (we pay)</option><option value="inbound">inbound (we receive)</option></select></div>
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.entityId} onChange={e => setEditForm({ ...editForm, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>{CONTRACTOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          {editForm.direction === 'outbound' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">YTD paid</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.ytdPaid} onChange={e => setEditForm({ ...editForm, ytdPaid: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly (avg)</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.monthly} onChange={e => setEditForm({ ...editForm, monthly: parseFloat(e.target.value) || 0 })} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">YTD received</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.ytdReceived} onChange={e => setEditForm({ ...editForm, ytdReceived: parseFloat(e.target.value) || 0 })} /></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly expected</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={editForm.monthlyExpected} onChange={e => setEditForm({ ...editForm, monthlyExpected: parseFloat(e.target.value) || 0 })} /></div>
            </div>
          )}
          <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes</label><textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" rows="2" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          <div className="flex gap-2">
            <button type="button" onClick={onSave} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Worker voice — hear their perspectives on operations. The family member
// records what the worker said after a job; it ships through uploadFeedback
// tagged 'worker-ops' (same rail, same live stream, read by the Concerns
// board's feedback read-through). Recent entries merge this session's own
// submissions with other devices' via subscribeFeedback (which returns OTHER
// users' rows only — our own are echoed locally on a confirmed upload, with
// the same author name feedback-sync writes to the row). Words are never
// swallowed: the draft clears ONLY on a confirmed upload (the Engagement
// MessageThread rule from the 2026-07-03 claims audit).
// -----------------------------------------------------------------------------
function WorkerVoice({ workers = [], incidents }) {
  const incidentsProvided = Array.isArray(incidents);
  const [signedIn, setSignedIn] = useState(false);
  const [me, setMe] = useState(null);
  const [remote, setRemote] = useState([]);
  const [localEntries, setLocalEntries] = useState([]);
  const [workerId, setWorkerId] = useState('');
  const [said, setSaid] = useState('');
  const [incidentId, setIncidentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthChange((s) => {
    setSignedIn(!!s);
    // Mirror the author name feedback-sync writes to the row (display_name =
    // email prefix), so the local echo shows the same real author the stream will.
    setMe(s?.user?.email?.split('@')[0] || null);
  }), []);

  useEffect(() => {
    if (!signedIn) { setRemote([]); return undefined; }
    return subscribeFeedback((items) => setRemote(items.filter(isWorkerVoice)));
  }, [signedIn]);

  const entries = voiceEntries([...localEntries, ...remote]);
  const openIncidents = incidentsProvided ? incidents.filter(i => i && i.status !== 'resolved') : [];

  const submit = async () => {
    const contractor = workers.find(w => w.id === workerId);
    const incident = openIncidents.find(i => i.id === incidentId) || null;
    const record = buildWorkerVoiceRecord({ contractor, said, incident });
    if (!record) { setError('Pick the worker and write what they said.'); return; }
    setSubmitting(true);
    setError('');
    const result = await uploadFeedback(record, { activeTab: WORKER_VOICE_AREA });
    setSubmitting(false);
    if (result && result.uploaded) {
      setLocalEntries(prev => [{ ...record, displayName: me || 'Member' }, ...prev]);
      setSaid('');
      setIncidentId('');
    } else {
      // Draft stays put; the reason is stated honestly.
      setError(result && result.skipped === 'signed-out'
        ? 'Sign in (top of the page) to record this — the words are still here.'
        : `Could not record (${(result && result.skipped) || 'error'}) — the words are still here.`);
    }
  };

  return (
    <section>
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Worker voice · operations</h3>
      <div className="bg-white border border-[#1A1815] p-4 space-y-2">
        <div className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          After a job, record what the worker said about the operation. It lands in the live feedback stream (tagged worker-ops) and the Projects · Concerns board reads it through.
        </div>
        {workers.length === 0 ? (
          <div className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Add an outbound contractor above first — the voice entry names who said it.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label htmlFor="wv-worker" className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Worker</label>
                <select id="wv-worker" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={workerId} onChange={e => setWorkerId(e.target.value)}>
                  <option value="">Who said it?</option>
                  {workers.map(w => <option key={w.id} value={w.id}>{w.name}{w.role ? ` · ${w.role}` : ''}</option>)}
                </select>
              </div>
              {incidentsProvided && openIncidents.length > 0 && (
                <div>
                  <label htmlFor="wv-incident" className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Link to a work order (optional)</label>
                  <select id="wv-incident" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={incidentId} onChange={e => setIncidentId(e.target.value)}>
                    <option value="">No specific job</option>
                    {openIncidents.map(i => <option key={i.id} value={i.id}>{i.description || i.id}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="wv-said" className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">What did they say about the operation?</label>
              <textarea id="wv-said" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder={'Their words, e.g. "the lockbox codes keep changing on us"'} value={said} onChange={e => setSaid(e.target.value)} />
            </div>
            {error && <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert">{error}</div>}
            <button type="button" onClick={submit} disabled={submitting} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838] disabled:opacity-60">
              {submitting ? 'Recording…' : 'Record worker voice'}
            </button>
            {!signedIn && (
              <div className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                Sign in (top of the page) to record — entries sync across devices through the feedback stream.
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Recent worker voice</div>
        {entries.length === 0 ? (
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4 text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            {signedIn
              ? 'No worker perspectives recorded yet.'
              : 'No worker perspectives on this device — sign in to see entries recorded on other devices.'}
          </div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {entries.map((f, i) => (
              <div key={f.id} className={`p-3 ${i < entries.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{f.text}</div>
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-1">
                  {f.displayName || 'Member'} · {fmtWhen(f.submittedAt || f.createdAt)}{f.remote ? ' · from another device' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function Contractors1099({ contractors = [], entities = [], addContractor, updateContractor, deleteContractor, incidents, currentDate, transactions = [] }) {
  // TAX YEAR drives the 1099-NEC threshold ($600 for 2024-2025; $2,000 for 2026+
  // under the OBBBA). The advisory + threshold calls MUST be told the year — the
  // library defaults to the latest known (2026/$2,000), so filing a PRIOR year
  // (e.g. TY2025 during the 2026 filing season) would wrongly read a $900 payment
  // as "under threshold, no 1099 needed" when $600 was the real line. This selector
  // makes the year explicit and correct (verified fix, 2026-07-18).
  const nowYear = (currentDate instanceof Date && !isNaN(currentDate)) ? currentDate.getFullYear() : 2026;
  const [taxYear, setTaxYear] = useState(nowYear);
  const TAX_YEARS = Array.from(new Set([nowYear, nowYear - 1, 2026, 2025, 2024])).filter(y => y >= 2024).sort((a, b) => b - a);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...BLANK_CONTRACTOR, entityId: entities[0]?.id || 'e-personal' });
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ ...BLANK_CONTRACTOR });

  const submitAdd = () => {
    if (!addForm.name.trim()) { setAddError('Name is required.'); return; }
    setAddError('');
    // Generate the id here so the FULL taxpayer id can be vaulted on THIS DEVICE
    // under the same id — the record itself only ever carries the last 4.
    const id = `k-${Date.now()}`;
    const last4 = addForm.taxIdFull ? setFullTaxId(id, addForm.taxIdFull, { type: addForm.taxIdType }) : (addForm.taxIdLast4 || '');
    const { taxIdFull, ...rest } = addForm;
    addContractor && addContractor({ ...rest, id, taxIdLast4: last4 });
    setAddForm({ ...BLANK_CONTRACTOR, entityId: entities[0]?.id || 'e-personal' });
    setShowAdd(false);
  };
  const startEdit = (c) => {
    setEditForm({
      direction: c.direction || 'outbound',
      entityId: c.entityId || 'e-personal',
      type: c.type || 'contractor',
      name: c.name || '',
      role: c.role || '',
      phone: c.phone || '',
      email: c.email || '',
      ytdPaid: c.ytdPaid || 0,
      ytdReceived: c.ytdReceived || 0,
      monthly: c.monthly || 0,
      monthlyExpected: c.monthlyExpected || 0,
      status: c.status || 'active',
      notes: c.notes || '',
      legalName: c.legalName || '',
      mailingAddress: c.mailingAddress || '',
      taxIdType: c.taxIdType || 'ein',
      taxIdFull: '', // never prefilled from storage — the full id stays vaulted
      taxIdLast4: c.taxIdLast4 || '',
      w9OnFile: !!c.w9OnFile,
    });
    setEditingId(c.id);
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = () => {
    if (!editingId) return;
    // A newly-typed full id is vaulted on-device; otherwise the existing last-4
    // is kept. The full id never lands on the record (never syncs).
    const last4 = editForm.taxIdFull ? setFullTaxId(editingId, editForm.taxIdFull, { type: editForm.taxIdType }) : (editForm.taxIdLast4 || '');
    const { taxIdFull, ...rest } = editForm;
    updateContractor && updateContractor(editingId, { ...rest, taxIdLast4: last4 });
    setEditingId(null);
  };

  const outbound = contractors.filter(c => c.direction === 'outbound');
  const inbound = contractors.filter(c => c.direction === 'inbound');
  // Manager state is derived ONLY from real, provided data. The shell mount
  // does not pass `incidents` today (poe-financial-mvp-v28.jsx k1099 mount),
  // so this stays undefined and the rows show an honest note instead of a
  // painted zero (Reality-Trace / DR-0076).
  const incidentsProvided = Array.isArray(incidents);

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>1099 Relationships</SectionTitle>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815]">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{contractors.length} contractor{contractors.length === 1 ? '' : 's'} · {outbound.length} we pay, {inbound.length} we receive from</div>
          </div>
          <div className="flex items-baseline gap-3">
            {/* Tax year — sets which 1099-NEC threshold the cards check ($600 for
                2024-2025, $2,000 for 2026+). Filing a prior year? Pick it here so a
                $600-2,000 payment isn't wrongly cleared. */}
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Tax year
              <select value={taxYear} onChange={e => setTaxYear(Number(e.target.value))} className="ml-1 border border-[#E8E4DC] bg-[#FAF8F4] text-[0.625rem] uppercase tracking-wider p-1">
                {TAX_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => setShowAdd(!showAdd)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">
              {showAdd ? '× Cancel' : '+ Add contractor'}
            </button>
          </div>
        </div>
        <div className="mb-3"><TaxIdVaultBackup /></div>
        {showAdd && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New 1099 relationship</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Name</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Person or company" value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} /></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Role</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="What they do for the business" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })} /></div>
            </div>
            <div>
              <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Relationship kind — sets the tax note + access default</label>
              <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.kind || 'business'} onChange={e => setAddForm({ ...addForm, kind: e.target.value })}>{WORKER_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
              <ClassificationNote kind={addForm.kind || 'business'} ytdPaid={addForm.ytdPaid} direction={addForm.direction} year={taxYear} />
              <TaxIdentityFields form={addForm} setForm={setAddForm} bg="bg-[#FAF8F4]" contractorId={null} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Phone (for one-tap dispatch)</label><input type="tel" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., 217-555-0142" value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} /></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Email</label><input type="email" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="worker@example.com" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Type</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value })}>{CONTRACTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Direction</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.direction} onChange={e => setAddForm({ ...addForm, direction: e.target.value })}><option value="outbound">outbound (we pay)</option><option value="inbound">inbound (we receive)</option></select></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.entityId} onChange={e => setAddForm({ ...addForm, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
              <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })}>{CONTRACTOR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            {addForm.direction === 'outbound' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">YTD paid</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.ytdPaid} onChange={e => setAddForm({ ...addForm, ytdPaid: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly (avg)</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.monthly} onChange={e => setAddForm({ ...addForm, monthly: parseFloat(e.target.value) || 0 })} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">YTD received</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.ytdReceived} onChange={e => setAddForm({ ...addForm, ytdReceived: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly expected</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={addForm.monthlyExpected} onChange={e => setAddForm({ ...addForm, monthlyExpected: parseFloat(e.target.value) || 0 })} /></div>
              </div>
            )}
            <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Notes</label><textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} /></div>
            {addError && <div className="text-xs text-[#B85838] px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert">{addError}</div>}
            <button type="button" onClick={submitAdd} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">Save contractor</button>
          </div>
        )}
      </section>

      {/* The three stacked lists now flow as sliding section tabs ("sliding
          tabs for all tabs instead of a long scroll", Darrell 2026-07-04). The
          header + Add form above stay PINNED; each block below moved verbatim.
          Hooks all live at the top level (or inside WorkerVoice itself) — the
          render thunks are plain closures over that state. */}
      <SectionTabs
        ariaLabel="1099 Relationships sections"
        idBase="k1099"
        defaultId="outbound"
        sections={[
          {
            id: 'outbound',
            label: 'Outbound',
            icon: 'users',
            render: () => (
      <section>
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Outbound · {outbound.length}</h3>
        {!incidentsProvided && outbound.length > 0 && (
          <div className="text-[0.6875rem] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Open work orders per worker aren&apos;t shown here yet — this tab isn&apos;t passed the incidents list. Dispatch and track work orders from Real Estate · Maintenance or the Big Picture Action Queue; when the shell passes incidents to this tab, each worker&apos;s open orders appear on their row automatically.
          </div>
        )}
        {outbound.length === 0 ? (
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4 text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>None yet. Add a contractor above to keep their contact, role, and the YTD amounts you record here in one place.</div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {outbound.map((c, i) => (
              <ContractorRow key={c.id} c={c} isLast={i === outbound.length - 1} entities={entities} onEdit={startEdit} onDelete={deleteContractor} editing={editingId === c.id} editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={cancelEdit} openWork={incidentsProvided ? workerOpenIncidents(c.id, incidents) : undefined} taxYear={taxYear} transactions={transactions} />
            ))}
          </div>
        )}
      </section>
            ),
          },
          {
            id: 'inbound',
            label: 'Inbound',
            icon: 'coins',
            render: () => (
      <section>
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Inbound · {inbound.length}</h3>
        {inbound.length === 0 ? (
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4 text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>None yet. Use this for 1099s you receive (e.g., independent contracting income).</div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {inbound.map((c, i) => (
              <ContractorRow key={c.id} c={c} isLast={i === inbound.length - 1} entities={entities} onEdit={startEdit} onDelete={deleteContractor} editing={editingId === c.id} editForm={editForm} setEditForm={setEditForm} onSave={saveEdit} onCancel={cancelEdit} taxYear={taxYear} transactions={transactions} />
            ))}
          </div>
        )}
      </section>
            ),
          },
          {
            id: 'voice',
            label: 'Worker voice',
            icon: 'mic',
            render: () => <WorkerVoice workers={outbound} incidents={incidents} />,
          },
        ]}
      />
    </div>
  );
}

export default Contractors1099;
