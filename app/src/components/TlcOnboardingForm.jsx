// =============================================================================
// TlcOnboardingForm — the colleague's intake packet, inside the TLC app
// =============================================================================
// (DR-0344) A new colleague opens Christina's one-time link on the TLC door,
// signs in, and meets the SAME questions the Drive form asked — one section at
// a time on the sliding tabs, saved as a draft as they go, submitted once the
// required answers and the three signed acknowledgments are in. The spec is
// data (lib/tlc-onboarding.js); this file only renders it and talks to the
// seam (lib/tlc-onboarding-sync.js).
//
// What this form NEVER does: ask for a password (CAQH access is granted inside
// CAQH), put banking in the packet (it goes to the walled table), or hold a
// file's bytes in the row (documents are pointers into a private bucket).
// The colleague can export their record and withdraw it at any time
// (USER-ACCOUNTS-AND-HISTORIES-STANDARD; DATA-AS-EMPOWERMENT).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SECTIONS, BANKING_FIELDS, DAYS, AVAILABILITY_SLOTS, NO_CLIENTS, PACKET_STATUSES,
  normalizePacket, validatePacket, validateBanking, packetProgress, labelFor, wordCount,
  exportPacketRecord, formatDate,
} from '../lib/tlc-onboarding.js';
import { openPacket, savePacket, uploadDocument, headshotThumbFromFile, withdrawPacket } from '../lib/tlc-onboarding-sync.js';
import SectionTabs from './SectionTabs.jsx';
import TlcOnboardingReadout from './TlcOnboardingReadout.jsx';
import TlcAgreementReader from './TlcAgreementReader.jsx';
import { agreementByKey } from '../lib/tlc-agreements.js';
import UiIcon from './UiIcon.jsx';

const AUTOSAVE_MS = 2500;
const INPUT = 'w-full min-h-[36px] p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN_PRIMARY = 'min-h-[36px] px-4 py-2 text-sm font-semibold bg-[#B85838] text-white hover:bg-[#1A1815] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const CHIP = (on) => `min-h-[36px] px-2.5 py-1 text-xs border focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`;

function Label({ htmlFor, field, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#1A1815] mb-1">
      {children || field.label}{field && field.required && <span className="text-[#B85838]" aria-hidden="true"> *</span>}
    </label>
  );
}

function FileField({ field, pointer, packetId, onPointer, onThumb, editable }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const id = `f-${field.key}`;
  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setMsg('');
    try {
      if (field.image && onThumb) {
        try { onThumb(await headshotThumbFromFile(file)); }
        catch (err) { setMsg((err && err.message) || 'that picture could not be read'); setBusy(false); return; }
      }
      const res = await uploadDocument({ packetId, docKey: field.key, file });
      if (!res.ok) { setMsg(res.message); setBusy(false); return; }
      onPointer(res.pointer);
      setMsg(`Attached ${file.name}.`);
    } finally { setBusy(false); }
  };
  return (
    <div className="mb-3">
      <Label htmlFor={id} field={field} />
      <div className="flex flex-wrap items-center gap-2">
        {pointer && pointer.path && <span className="text-xs text-[#3F5226] break-all"><UiIcon name="check" className="w-3 h-3 inline mr-1" />{pointer.fileName}</span>}
        {editable && (
          <input id={id} type="file" onChange={pick} disabled={busy}
            accept={field.image ? 'image/*' : '.pdf,.doc,.docx,image/*'}
            className="text-xs file:min-h-[36px] file:px-3 file:border file:border-[#1A1815] file:bg-white file:text-[#1A1815] file:text-xs file:font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]" />
        )}
        {busy && <span className="text-xs text-[#5A5751]">Uploading…</span>}
      </div>
      {msg && <p className="text-xs text-[#5A5751] mt-1" role="status">{msg}</p>}
    </div>
  );
}

function TextField({ field, value, onChange, editable }) {
  const id = `f-${field.key}`;
  const common = { id, value: value || '', disabled: !editable, onChange: (e) => onChange(e.target.value), className: INPUT };
  const words = field.words ? wordCount(value) : null;
  return (
    <div className="mb-3">
      <Label htmlFor={id} field={field} />
      {field.type === 'textarea'
        ? <textarea rows={field.words ? 8 : 3} {...common} />
        : field.type === 'select'
          ? <select {...common}><option value="">Choose…</option>{field.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
          : <input type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'} autoComplete={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'off'} {...common} />}
      {field.words && <p className={`text-xs mt-1 ${words > field.words[1] ? 'text-[#B85838]' : 'text-[#5A5751]'}`}>{words} words · TLC asks for {field.words[0]}–{field.words[1]}</p>}
    </div>
  );
}

function YesNo({ field, value, onChange, editable }) {
  return (
    <fieldset className="mb-3" disabled={!editable}>
      <legend className="text-xs font-semibold text-[#1A1815] mb-1">{field.label}</legend>
      <div className="flex gap-2">
        {[['Yes', true], ['No', false]].map(([l, v]) => (
          <label key={l} className={CHIP(value === v) + ' inline-flex items-center gap-1.5 cursor-pointer'}>
            <input type="radio" name={`f-${field.key}`} checked={value === v} onChange={() => onChange(v)} className="sr-only" />{l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function MultiSelect({ field, value, onChange, editable }) {
  const list = Array.isArray(value) ? value : [];
  const toggle = (id) => onChange(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return (
    <fieldset className="mb-3" disabled={!editable}>
      <legend className="text-xs font-semibold text-[#1A1815] mb-1">{field.label}</legend>
      <ul className="space-y-1">
        {field.options.map((o) => (
          <li key={o.id}>
            <label className="flex items-start gap-2 min-h-[36px] cursor-pointer">
              <input type="checkbox" checked={list.includes(o.id)} onChange={() => toggle(o.id)} className="mt-1 h-4 w-4 focus:outline focus:outline-2 focus:outline-[#B85838]" />
              <span className="text-sm text-[#1A1815]"><b>{o.label}</b> <span className="text-[#5A5751]">— {o.detail}</span></span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function Availability({ value, onChange, editable }) {
  const avail = value || {};
  const set = (day, slots) => onChange({ ...avail, [day]: slots });
  const toggle = (day, slot) => {
    const cur = Array.isArray(avail[day]) ? avail[day] : [];
    if (slot === NO_CLIENTS) return set(day, cur.includes(NO_CLIENTS) ? [] : [NO_CLIENTS]);
    const without = cur.filter((s) => s !== NO_CLIENTS);
    set(day, without.includes(slot) ? without.filter((s) => s !== slot) : [...without, slot]);
  };
  return (
    <div className="space-y-3">
      {DAYS.map((day) => {
        const cur = Array.isArray(avail[day]) ? avail[day] : [];
        return (
          <fieldset key={day} disabled={!editable}>
            <legend className="text-xs font-semibold text-[#1A1815] mb-1">{day}</legend>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => toggle(day, NO_CLIENTS)} aria-pressed={cur.includes(NO_CLIENTS)} className={CHIP(cur.includes(NO_CLIENTS))}>{NO_CLIENTS}</button>
              {AVAILABILITY_SLOTS.map((slot) => (
                <button key={slot} type="button" onClick={() => toggle(day, slot)} aria-pressed={cur.includes(slot)} className={CHIP(cur.includes(slot))}>{slot}</button>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function Acknowledgment({ field, value, onChange, pointer, packetId, onPointer, editable }) {
  const a = value || { agreed: false, signature: '', signedOn: '' };
  const [reading, setReading] = useState(false);
  const id = `f-${field.key}`;
  return (
    <div className="mb-4 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-sm font-bold text-[#1A1815] mb-1">{field.label}</div>
      <button type="button" onClick={() => setReading((v) => !v)} aria-expanded={reading} className="inline-flex items-center gap-1 min-h-[36px] text-xs underline text-[#B85838] mb-2 focus:outline focus:outline-2 focus:outline-[#B85838]">
        <UiIcon name="bookOpen" className="w-3 h-3" /> {reading ? 'Hide' : 'Read'} the {field.docName} (in the app)
      </button>
      {reading && <div className="mb-3"><TlcAgreementReader docKey={field.key} agreement={agreementByKey(field.key)} title={field.docName} /></div>}
      <p className="text-xs text-[#5A5751] leading-relaxed mb-2">{field.statement}</p>
      <label className="flex items-start gap-2 min-h-[36px] cursor-pointer mb-2">
        <input type="checkbox" checked={a.agreed === true} disabled={!editable} onChange={(e) => onChange({ ...a, agreed: e.target.checked })} className="mt-1 h-4 w-4 focus:outline focus:outline-2 focus:outline-[#B85838]" />
        <span className="text-sm text-[#1A1815]">I have read this and I agree.</span>
      </label>
      <Label htmlFor={id} field={field}>Sign by typing your full legal name</Label>
      <input id={id} value={a.signature || ''} disabled={!editable} autoComplete="name" className={INPUT}
        onChange={(e) => onChange({ ...a, signature: e.target.value, signedOn: e.target.value.trim() ? (a.signedOn || new Date().toISOString().slice(0, 10)) : '' })} />
      {a.signedOn && <p className="text-xs text-[#5A5751] mt-1">Dated {formatDate(a.signedOn)}</p>}
      {field.attach && (
        <div className="mt-2">
          <FileField field={{ key: `${field.key}Signed`, label: `Attach the signed ${field.docName}` }} pointer={pointer} packetId={packetId} onPointer={onPointer} editable={editable} />
        </div>
      )}
    </div>
  );
}

function Banking({ banking, masked, onChange, editable }) {
  const v = validateBanking(banking);
  return (
    <div>
      {masked && (
        <p className="text-xs text-[#3F5226] mb-2"><UiIcon name="check" className="w-3 h-3 inline mr-1" />On file: {masked.bank_name} · {masked.account_type} · routing ····{masked.routing_last4} · account ····{masked.account_last4}. Enter new details below only to replace them.</p>
      )}
      {BANKING_FIELDS.map((f) => (
        <div key={f.key} className="mb-3">
          <Label htmlFor={`b-${f.key}`} field={f} />
          {f.type === 'select'
            ? <select id={`b-${f.key}`} value={banking[f.key] || 'checking'} disabled={!editable} onChange={(e) => onChange({ ...banking, [f.key]: e.target.value })} className={INPUT}>{f.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
            : <input id={`b-${f.key}`} value={banking[f.key] || ''} disabled={!editable} inputMode={f.key === 'bankName' ? 'text' : 'numeric'} autoComplete="off" className={INPUT}
                onChange={(e) => onChange({ ...banking, [f.key]: e.target.value })} />}
        </div>
      ))}
      {!v.empty && v.errors.length > 0 && <ul className="text-xs text-[#B85838] list-disc pl-4" role="alert">{v.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      <p className="text-[0.6875rem] text-[#8A857C] leading-relaxed mt-2 flex items-start gap-1.5"><UiIcon name="lock" className="w-3 h-3 mt-0.5 shrink-0" /><span>These numbers are saved apart from the rest of your packet. Only the office owner can open them, and every time they do it is written to the audit log.</span></p>
    </div>
  );
}

export default function TlcOnboardingForm({ token }) {
  const [view, setView] = useState(null);
  const [packet, setPacket] = useState(null);
  const [headshotThumb, setHeadshotThumb] = useState(undefined); // undefined = unchanged
  const [banking, setBanking] = useState({ bankName: '', accountType: 'checking', routingNumber: '', accountNumber: '' });
  const [loadError, setLoadError] = useState('');
  const [saveState, setSaveState] = useState('idle'); // idle | dirty | saving | saved | failed
  const [saveMsg, setSaveMsg] = useState('');
  const [missing, setMissing] = useState([]);
  const [problems, setProblems] = useState([]);
  const [withdrawing, setWithdrawing] = useState(false);
  const [gone, setGone] = useState(false);
  const timer = useRef(null);
  const latest = useRef({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await openPacket(token);
      if (!alive) return;
      if (!res.ok) { setLoadError(res.message); return; }
      setView(res.view);
      setPacket(normalizePacket(res.view.packet));
    })();
    return () => { alive = false; };
  }, [token]);

  const status = view ? view.status : null;
  const editable = status === 'draft' || status === 'returned';
  latest.current = { view, packet, headshotThumb, banking };

  const persist = useCallback(async ({ submit = false } = {}) => {
    const cur = latest.current;
    if (!cur.view || !cur.packet) return { ok: false };
    const b = validateBanking(cur.banking);
    if (!b.empty && !b.ok) { setProblems(b.errors); setSaveState('failed'); setSaveMsg('Fix the direct deposit details before saving.'); return { ok: false }; }
    if (submit) {
      const v = validatePacket(cur.packet, { forSubmit: true });
      if (!v.ok) { setMissing(v.missing); setProblems(v.errors); setSaveState('failed'); setSaveMsg('A few things are still needed before you can submit.'); return { ok: false }; }
    }
    setSaveState('saving'); setSaveMsg('');
    const res = await savePacket({ packetId: cur.view.packet_id, packet: cur.packet, headshotThumb: cur.headshotThumb, banking: b.empty ? null : b.fields, submit });
    if (!res.ok) { setSaveState('failed'); setSaveMsg(res.message); return res; }
    if (submit && !res.submitted) { setMissing(res.missing); setSaveState('failed'); setSaveMsg('The office needs a few more answers before this can be submitted.'); return res; }
    setMissing([]); setProblems([]);
    if (res.view) { setView(res.view); setPacket(normalizePacket(res.view.packet)); }
    if (!b.empty) setBanking({ bankName: '', accountType: 'checking', routingNumber: '', accountNumber: '' });
    setHeadshotThumb(undefined);
    setSaveState('saved'); setSaveMsg(submit ? 'Submitted. Christina will review it and you will see the outcome here.' : `Saved ${new Date().toLocaleTimeString()}.`);
    return res;
  }, []);

  // Autosave a draft a moment after the last change; never while submitting.
  const touch = useCallback(() => {
    setSaveState('dirty');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; persist(); }, AUTOSAVE_MS);
  }, [persist]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const setField = (key, value) => { setPacket((p) => ({ ...p, [key]: value })); touch(); };
  const setDoc = (key, pointer) => { setPacket((p) => ({ ...p, documents: { ...(p.documents || {}), [key]: pointer } })); touch(); };
  const setAck = (key, value) => { setPacket((p) => ({ ...p, acknowledgments: { ...(p.acknowledgments || {}), [key]: value } })); touch(); };
  const setBank = (b) => { setBanking(b); touch(); };

  const progress = useMemo(() => (packet ? packetProgress(packet) : { done: 0, total: 0, pct: 0 }), [packet]);

  const exportRecord = () => {
    const rec = exportPacketRecord({ ...view, packet });
    if (!rec) return;
    try {
      const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `tlc-onboarding-${(rec.answers['Last Name'] || 'packet').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setSaveMsg('The export could not be started on this device.'); }
  };

  const withdraw = async () => {
    const res = await withdrawPacket(view);
    if (!res.ok) { setSaveMsg(res.message); setWithdrawing(false); return; }
    setGone(true);
  };

  if (gone) {
    return <div className="border border-[#E8E4DC] bg-white p-4"><p className="text-sm text-[#1A1815] font-semibold">Your packet was withdrawn and deleted.</p><p className="text-xs text-[#5A5751] mt-1">Its files and direct-deposit details went with it. Ask Christina for a new link if you want to start again.</p></div>;
  }
  if (loadError) {
    return <div className="border border-[#B85838] bg-white p-4" role="alert"><p className="text-sm text-[#1A1815] font-semibold">This invitation could not be opened.</p><p className="text-xs text-[#5A5751] mt-1">{loadError}</p></div>;
  }
  if (!view || !packet) return <p className="text-sm text-[#5A5751]">Opening your packet…</p>;

  const st = PACKET_STATUSES[status] || PACKET_STATUSES.draft;
  const docs = packet.documents || {};

  const sections = SECTIONS.map((s) => ({
    id: s.id, label: s.title,
    render: () => (
      <div className="pt-3">
        <p className="text-xs text-[#5A5751] leading-relaxed mb-3">{s.blurb}</p>
        {s.id === 'banking' && <Banking banking={banking} masked={view.banking} onChange={setBank} editable={editable} />}
        {s.fields.map((f) => {
          if (f.type === 'file') return <FileField key={f.key} field={f} pointer={docs[f.key]} packetId={view.packet_id} editable={editable} onPointer={(ptr) => setDoc(f.key, ptr)} onThumb={f.image ? (t) => { setHeadshotThumb(t); touch(); } : null} />;
          if (f.type === 'yesno') return <YesNo key={f.key} field={f} value={packet[f.key]} onChange={(v) => setField(f.key, v)} editable={editable} />;
          if (f.type === 'multiselect') return <MultiSelect key={f.key} field={f} value={packet[f.key]} onChange={(v) => setField(f.key, v)} editable={editable} />;
          if (f.type === 'availability') return <Availability key={f.key} value={packet.availability} onChange={(v) => setField('availability', v)} editable={editable} />;
          if (f.type === 'acknowledgment') return <Acknowledgment key={f.key} field={f} value={packet.acknowledgments[f.key]} onChange={(v) => setAck(f.key, v)} pointer={docs[`${f.key}Signed`]} packetId={view.packet_id} onPointer={(ptr) => setDoc(`${f.key}Signed`, ptr)} editable={editable} />;
          return <TextField key={f.key} field={f} value={packet[f.key]} onChange={(v) => setField(f.key, v)} editable={editable} />;
        })}
      </div>
    ),
  }));
  sections.push({
    id: 'review', label: 'Review & submit',
    render: () => (
      <div className="pt-3 space-y-3">
        {editable ? (
          <>
            <p className="text-xs text-[#5A5751] leading-relaxed">Look it over. When it is right, submit it to {view.office_name || 'the office'}. You can still export or withdraw it afterward.</p>
            {(missing.length > 0 || problems.length > 0) && (
              <div className="border border-[#B85838] bg-white p-3" role="alert">
                <div className="text-xs font-semibold text-[#B85838] mb-1">Still needed</div>
                <ul className="text-xs text-[#1A1815] list-disc pl-4">
                  {missing.map((k) => <li key={k}>{labelFor(k)}</li>)}
                  {problems.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => persist()} disabled={saveState === 'saving'} className={`${BTN}`}>Save draft</button>
              <button type="button" onClick={() => persist({ submit: true })} disabled={saveState === 'saving'} className={`${BTN_PRIMARY}`}>Submit to {view.office_name || 'the office'}</button>
            </div>
          </>
        ) : (
          <p className="text-xs text-[#5A5751] leading-relaxed">{status === 'approved' ? 'Welcome to the team. Your packet is approved and you are on the roster.' : 'Your packet is with Christina. You will see her answer here.'}</p>
        )}
        <TlcOnboardingReadout view={{ ...view, packet, headshot_thumb: headshotThumb === undefined ? view.headshot_thumb : headshotThumb }} />
      </div>
    ),
  });

  return (
    <div className="space-y-3">
      <div className="border border-[#1A1815] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Colleague intake</div>
            <div className="text-sm font-bold text-[#1A1815]">{view.office_name || 'TLC Therapy Solutions'} · {st.label}</div>
            <div className="text-xs text-[#5A5751]">{progress.done} of {progress.total} answered · {progress.pct}%</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportRecord} className={`${BTN}`}>Export my packet</button>
            {!withdrawing
              ? <button type="button" onClick={() => setWithdrawing(true)} className="min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">Withdraw…</button>
              : <span className="inline-flex items-center gap-2 text-xs text-[#1A1815]">Delete this packet and its files?
                  <button type="button" onClick={withdraw} className="min-h-[36px] px-3 text-xs font-semibold bg-[#B85838] text-white hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Yes, withdraw</button>
                  <button type="button" onClick={() => setWithdrawing(false)} className={`${BTN}`}>Keep it</button>
                </span>}
          </div>
        </div>
        {status === 'returned' && view.review_note && (
          <div className="mt-2 border border-[#B85838] bg-[#FAF8F4] p-2 text-xs text-[#1A1815]" role="alert"><b>Returned with a note:</b> {view.review_note}</div>
        )}
        <div className="mt-2 text-xs" role="status" aria-live="polite">
          {saveState === 'saving' && <span className="text-[#5A5751]">Saving…</span>}
          {saveState === 'dirty' && <span className="text-[#5A5751]">Unsaved changes — saving shortly.</span>}
          {saveState === 'saved' && <span className="text-[#3F5226]">{saveMsg}</span>}
          {saveState === 'failed' && <span className="text-[#B85838]">{saveMsg}</span>}
        </div>
      </div>
      <SectionTabs sections={sections} ariaLabel="Intake packet sections" idBase="tlc-intake" defaultId={editable ? 'about' : 'review'} />
    </div>
  );
}
