// =============================================================================
// ContactsImport — bring your contacts from the phone in your hand (DR-0736)
// =============================================================================
// Darrell 2026-10-01: "upload phone contacts into PoeTech from the cellphone."
// Two doors, both landing in the same plan and the same keeper:
//   * Pick from my phone — the browser's Contact Picker, shown only where the
//     phone has it (Android Chrome in the installed app); never a dead button.
//   * Upload my contacts file (.vcf) — every phone and Google Contacts can share
//     all contacts as one vCard file; works on every device.
// The plan is shown BEFORE anything is kept: "N new · M already saved · K
// already on PoeTech", every row named, then one Save. Saving keeps the rows on
// your own server (migration 0247, yours alone) and in this device's list; when
// not signed in it keeps them on the device and says so. Nothing is merged.
// =============================================================================
import React, { useRef, useState } from 'react';
import { parseVCardFile } from '../lib/vcard-parse.js';
import { pickerSupported, fromPickerResults, planImport, summaryLine } from '../lib/contacts-import.js';
import { saveImportedContacts } from '../lib/contacts-store.js';
import { readContacts } from '../lib/saved-contacts.js';
import { formatPhone } from '../lib/member-contact.js';

const BTN = 'px-2.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-wider min-h-[36px] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const STATUS = { new: 'new', saved: 'already saved', 'on-poetech': 'already on PoeTech' };

function readFileText(file) {
  return new Promise((resolve, reject) => {
    try {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = () => reject(fr.error || new Error('could not read the file'));
      fr.readAsText(file);
    } catch (e) { reject(e); }
  });
}

export default function ContactsImport({ roster = [], onSaved, nav = typeof navigator !== 'undefined' ? navigator : undefined }) {
  const [plan, setPlan] = useState(null);
  const [source, setSource] = useState('file');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const canPick = pickerSupported(nav);

  const planFrom = (incoming, from) => {
    const saved = readContacts();
    const p = planImport(incoming, saved, roster);
    setSource(from);
    setPlan(p);
    setMsg(p.rows.length ? '' : 'Nothing to bring in from that.');
  };

  const pickFromPhone = async () => {
    setMsg('');
    try {
      const props = ['name', 'tel', 'email'];
      try {
        const have = await nav.contacts.getProperties();
        if (Array.isArray(have) && have.includes('address')) props.push('address');
      } catch { /* the phone did not say; ask for the three */ }
      const results = await nav.contacts.select(props, { multiple: true });
      planFrom(fromPickerResults(results), 'picker');
    } catch (e) {
      // A cancelled picker is not an error; anything else is said plainly.
      const name = e && e.name ? e.name : '';
      if (name !== 'AbortError') setMsg(`Could not read the phone's contacts (${e && e.message ? e.message : name || 'unknown'}).`);
    }
  };

  const onFile = async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    setMsg('');
    try {
      const text = await readFileText(file);
      const r = parseVCardFile(text);
      if (r.errors.length) { setMsg(r.errors.join(' ')); setPlan(null); return; }
      planFrom(r.contacts, 'file');
      if (r.skipped) setMsg(`${r.skipped} card${r.skipped === 1 ? '' : 's'} had no name, phone or email and ${r.skipped === 1 ? 'was' : 'were'} left out.`);
    } catch (e) {
      setMsg(`Could not read ${file.name}: ${e && e.message ? e.message : 'unknown error'}.`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    if (!plan || !plan.rows.length || busy) return;
    setBusy(true);
    try {
      const r = await saveImportedContacts(plan.rows, { source });
      setMsg(`Kept ${r.kept} contact${r.kept === 1 ? '' : 's'}. ${r.reason}${r.error ? ` (${r.error})` : ''}`);
      setPlan(null);
      onSaved && onSaved(r);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-1.5 border-t border-[#E8E4DC] pt-2" data-testid="contacts-import">
      <p className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Bring your contacts from your phone</p>
      <div className="flex flex-wrap gap-1.5">
        {canPick && (
          <button type="button" onClick={pickFromPhone} data-testid="contacts-pick-from-phone" className={`${BTN} border border-[#1A1815] text-[#1A1815]`}>
            Pick from my phone
          </button>
        )}
        <label className={`${BTN} border border-[#1A1815] text-[#1A1815] cursor-pointer inline-flex items-center`}>
          Upload my contacts file (.vcf)
          <input
            ref={fileRef} type="file" accept=".vcf,text/vcard,text/x-vcard,text/directory" onChange={onFile}
            data-testid="contacts-upload-vcf" aria-label="Upload my contacts file (.vcf)" className="sr-only"
          />
        </label>
      </div>
      <p className="text-[0.5625rem] text-[#5A5751] leading-snug">
        {canPick ? 'Pick one, some or all from your phone, or share' : 'On your phone, share'} all your contacts as a .vcf file (Contacts &rarr; Share or Export) and upload it here.
        You see the list before anything is kept. Contacts are kept on your own server and are yours alone; nothing is merged with anyone&rsquo;s account.
      </p>
      {msg && <p className="text-xs text-[#1A1815]" role="status">{msg}</p>}
      {plan && plan.rows.length > 0 && (
        <div className="space-y-1.5" data-testid="contacts-import-preview">
          <p className="text-xs font-semibold text-[#1A1815]" data-testid="contacts-import-summary">{summaryLine(plan.summary)}</p>
          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {plan.rows.map((r) => (
              <li key={r.key} className="bg-white border border-[#E8E4DC] p-2 text-[0.625rem] text-[#1A1815]" data-status={r.status}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{r.contact.name || r.contact.phones[0] || r.contact.emails[0] || 'Contact'}</span>
                  <span className="uppercase tracking-wider text-[#5A6E3D]">{STATUS[r.status] || r.status}</span>
                </div>
                <div className="text-[#5A5751] mt-0.5">
                  {r.contact.phones[0] ? formatPhone(r.contact.phones[0]) : 'no cellphone'}
                  {' · '}
                  {r.contact.emails[0] || 'no email'}
                  {r.contact.phones.length + r.contact.emails.length > 2 ? ` · +${r.contact.phones.length + r.contact.emails.length - 2} more` : ''}
                  {r.match && r.match.who ? ` · ${r.status === 'on-poetech' ? 'on PoeTech as' : 'saved as'} ${r.match.who} (same ${r.match.by})` : ''}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={save} disabled={busy} data-testid="contacts-import-save" className={`${BTN} bg-[#B85838] text-white`}>
              {busy ? 'Keeping…' : `Keep ${plan.rows.length} contact${plan.rows.length === 1 ? '' : 's'}`}
            </button>
            <button type="button" onClick={() => { setPlan(null); setMsg(''); }} data-testid="contacts-import-clear" className={`${BTN} border border-[#5A5751] text-[#5A5751]`}>
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
