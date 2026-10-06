// =============================================================================
// Vault — a person's passwords, locked on their own device, kept on their own
// server (DR-0762)
// =============================================================================
// Darrell 2026-10-06: "I also want to be able to pull my passwords into the
// PoeTech App as a sort of password management manager for the users..."
//
// Reality-trace, out loud (CLAUDE.md, P15/P16):
//   REAL DATA  vault_header + vault_items on the sovereign Supabase (0251),
//              ciphertext only, owner-only RLS; a ciphertext cache on this
//              device so the vault opens offline. The clear records exist only
//              in this component's memory while it is open.
//   END-TO-END signed-in user -> header -> passphrase -> key (never leaves
//              memory) -> items decrypted here -> edits encrypted here -> rows.
//   THE SCREEN create (once) / unlock / the list; import from the exports
//              people already have; export back out; a generator; an audit;
//              auto-lock on idle and when the tab hides.
//   PREMISES   stated in lib/vault-crypto.js. The one the person must hear:
//              nobody can reset the passphrase, because nobody else has it.
//
// A surface never goes blank (P15, DR-0381): every state says what it sees and
// the way forward. Progressive disclosure: the list is the essential view;
// generator, import, export and audit open on demand, in place.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { confirmThen } from '../lib/confirm-action.js';
import {
  KDF_ITERATIONS, newSalt, deriveVaultKey, encryptJson, decryptJson, makeHeader, checkVerifier,
  normalizeItem, hostOf, newId, generatePassword, passwordStrength, auditItems, EMPTY_ITEM,
} from '../lib/vault-crypto.js';
import { importText, planImport, toCsv } from '../lib/vault-import.js';
import * as store from '../lib/vault-store.js';

export const IDLE_LOCK_MS = 5 * 60 * 1000;
export const CLIPBOARD_CLEAR_MS = 30 * 1000;

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnDark = 'bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-40 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnGhost = 'text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] min-h-[36px] px-2 focus:outline focus:outline-2 focus:outline-[#B85838]';
const chipCls = 'inline-block text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border';
const chip = {
  ok: `${chipCls} border-[#5A6E3D] text-[#5A6E3D] bg-[#5A6E3D]/5`,
  wait: `${chipCls} border-[#8A6E1F] text-[#8A6E1F] bg-[#8A6E1F]/5`,
  blocked: `${chipCls} border-[#B85838] text-[#B85838] bg-[#B85838]/5`,
  muted: `${chipCls} border-[#B8B4AC] text-[#5A5751] bg-white`,
};

const COVENANT = 'Your passwords are locked on this device with your passphrase before they leave it. The server holds only the locked form; nobody at PoeTech, and nobody with the database, can read them. Nobody can reset the passphrase either, because nobody else has it: keep the encrypted backup.';

function Strength({ value }) {
  const s = passwordStrength(value);
  const tone = s.label === 'empty' ? chip.muted : s.ok ? chip.ok : s.label === 'fair' ? chip.wait : chip.blocked;
  return <span className={tone}>{s.label}{s.bits ? ` · ~${s.bits} bits` : ''}</span>;
}

function downloadText(name, text, type = 'text/plain') {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* fine */ } }, 1000);
    return true;
  } catch { return false; }
}

export default function Vault() {
  const [userId, setUserId] = useState(undefined); // undefined = asking; null = signed out
  const [header, setHeader] = useState(undefined);  // undefined = loading; null = none yet
  const [rows, setRows] = useState([]);              // ciphertext rows (cache + cloud merged)
  const [loadNote, setLoadNote] = useState('');      // honest line about the last load
  const [key, setKey] = useState(null);              // CryptoKey while open
  const [items, setItems] = useState([]);            // clear records while open
  const [lockedRows, setLockedRows] = useState(0);   // rows this key could not open
  const [pending, setPending] = useState({});        // id -> reason (saved here, not yet on the server)
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);      // {id?, ...fields} or null
  const [revealed, setRevealed] = useState({});
  const [panel, setPanel] = useState('');            // '' | 'import' | 'export' | 'audit' | 'generate'
  const [importPlan, setImportPlan] = useState(null);
  const [gen, setGen] = useState({ length: 20, upper: true, lower: true, digits: true, symbols: true });
  const [copied, setCopied] = useState('');
  const keyRef = useRef(null);
  const idleTimer = useRef(null);
  const clipToken = useRef(0);

  // --- who, and what the server holds ------------------------------------------
  const load = useCallback(async () => {
    const uid = await store.currentUserId();
    setUserId(uid);
    if (!uid) { setHeader(null); return; }
    const cached = store.readCache(uid);
    if (cached) { setHeader(cached.header || null); setRows(cached.items || []); }
    const h = await store.loadHeader();
    const it = await store.listItems();
    if (h.ok) setHeader(h.header);
    else if (!cached) setHeader(null);
    if (it.ok) {
      const merged = store.mergeRows(cached ? cached.items : [], it.rows);
      setRows(merged);
      store.writeCache(uid, { header: h.ok ? h.header : (cached ? cached.header : null), items: merged });
      setLoadNote(`server read ${new Date().toLocaleTimeString()}`);
    } else {
      setLoadNote(cached ? `offline: this device's copy (${it.message})` : `could not reach the server: ${it.message}`);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // --- lock ---------------------------------------------------------------------
  const lock = useCallback(() => {
    keyRef.current = null; setKey(null); setItems([]); setRevealed({}); setEditing(null); setPanel(''); setImportPlan(null); setPass(''); setPass2('');
  }, []);
  const armIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => lock(), IDLE_LOCK_MS);
  }, [lock]);
  useEffect(() => {
    if (!key || typeof document === 'undefined') return undefined;
    armIdle();
    const onAct = () => armIdle();
    const onVis = () => { if (document.visibilityState === 'hidden') lock(); };
    const evs = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    evs.forEach((e) => document.addEventListener(e, onAct, { passive: true }));
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(idleTimer.current);
      evs.forEach((e) => document.removeEventListener(e, onAct));
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [key, armIdle, lock]);
  useEffect(() => () => { keyRef.current = null; }, []);

  // --- open ---------------------------------------------------------------------
  const openWith = useCallback(async (k, hdr, rowSet) => {
    const out = []; let locked = 0;
    for (const r of rowSet) {
      if (r.deletedAt) continue;
      const clear = await decryptJson(k, { iv: r.iv, ct: r.ct });
      if (clear && typeof clear === 'object') out.push({ id: r.id, ...normalizeItem(clear), updatedAt: r.updatedAt });
      else locked += 1;
    }
    out.sort((a, b) => (b.favorite - a.favorite) || a.name.localeCompare(b.name));
    keyRef.current = k; setKey(k); setItems(out); setLockedRows(locked); setError(''); setPass(''); setPass2('');
  }, []);

  const create = async () => {
    setError('');
    if (passwordStrength(pass).bits < 50) { setError('Choose a longer passphrase: four or more unrelated words is the simplest strong one.'); return; }
    if (pass !== pass2) { setError('The two passphrases differ.'); return; }
    setBusy('Deriving your key (this takes a moment on purpose)...');
    try {
      const salt = newSalt();
      const k = await deriveVaultKey(pass, salt, KDF_ITERATIONS);
      const hdr = k && await makeHeader(k, salt, KDF_ITERATIONS);
      if (!hdr) { setError('This browser could not derive a key (WebCrypto missing).'); return; }
      const saved = await store.saveHeader(userId, hdr);
      if (!saved.ok) { setError(`The server did not take the vault header: ${saved.message}. Nothing was created.`); return; }
      setHeader(hdr); store.writeCache(userId, { header: hdr, items: [] });
      await openWith(k, hdr, []);
    } finally { setBusy(''); }
  };

  const unlock = async () => {
    setError('');
    if (!header) return;
    setBusy('Checking your passphrase...');
    try {
      const k = await deriveVaultKey(pass, header.salt, header.iterations);
      if (!k || !(await checkVerifier(k, header))) { setError('That passphrase does not open this vault.'); return; }
      await openWith(k, header, rows);
    } finally { setBusy(''); }
  };

  // --- write -------------------------------------------------------------------
  const persist = useCallback(async (clearItem) => {
    const k = keyRef.current; if (!k) return false;
    const sealed = await encryptJson(k, normalizeItem(clearItem));
    if (!sealed) { setError('Could not lock the record on this device.'); return false; }
    const row = { id: clearItem.id, iv: sealed.iv, ct: sealed.ct, version: 1, updatedAt: new Date().toISOString(), deletedAt: null };
    const next = store.mergeRows(rows, [row]);
    setRows(next); store.writeCache(userId, { header, items: next });
    setItems((list) => {
      const others = list.filter((x) => x.id !== clearItem.id);
      return [...others, { ...normalizeItem(clearItem), id: clearItem.id, updatedAt: row.updatedAt }].sort((a, b) => (b.favorite - a.favorite) || a.name.localeCompare(b.name));
    });
    const r = await store.upsertItem(userId, row);
    setPending((p) => { const q = { ...p }; if (r.ok) delete q[clearItem.id]; else q[clearItem.id] = r.message; return q; });
    return true;
  }, [rows, userId, header]);

  const remove = async (id) => {
    const row = rows.find((r) => r.id === id);
    const next = store.mergeRows(rows, [{ ...(row || { id, iv: '', ct: '' }), updatedAt: new Date().toISOString(), deletedAt: new Date().toISOString() }]);
    setRows(next); store.writeCache(userId, { header, items: next });
    setItems((list) => list.filter((x) => x.id !== id));
    const r = await store.deleteItem(userId, id);
    setPending((p) => { const q = { ...p }; if (r.ok) delete q[id]; else q[id] = r.message; return q; });
  };

  const retryPending = async () => {
    for (const id of Object.keys(pending)) {
      const row = rows.find((r) => r.id === id); if (!row) continue;
      const r = row.deletedAt ? await store.deleteItem(userId, id) : await store.upsertItem(userId, row);
      setPending((p) => { const q = { ...p }; if (r.ok) delete q[id]; else q[id] = r.message; return q; });
    }
  };

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      const token = ++clipToken.current;
      setCopied(what); setTimeout(() => setCopied(''), 1600);
      setTimeout(async () => { if (clipToken.current === token) { try { await navigator.clipboard.writeText(''); } catch { /* gone */ } } }, CLIPBOARD_CLEAR_MS);
    } catch { setError('The clipboard is not available here; reveal and copy by hand.'); }
  };

  const runImport = async () => {
    if (!importPlan) return;
    setBusy(`Locking ${importPlan.added.length} records...`);
    try {
      for (const it of importPlan.added) await persist({ ...it, id: newId() });
      setImportPlan({ ...importPlan, done: true });
    } finally { setBusy(''); }
  };

  const onImportFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    const r = importText(text);
    if (r.error) { setImportPlan({ error: r.error, label: r.label || '', added: [], duplicates: [], skipped: r.skipped || 0 }); return; }
    const plan = planImport(items, r.items);
    setImportPlan({ format: r.format, label: r.label, added: plan.added, duplicates: plan.duplicates, skipped: r.skipped, fileName: file.name });
  };

  const exportEncrypted = () => {
    const payload = { poetechVault: 1, exportedAt: new Date().toISOString(), header: { kdf: header.kdf, iterations: header.iterations, salt: header.salt, verifier_iv: header.verifier_iv, verifier_ct: header.verifier_ct }, items: rows.filter((r) => !r.deletedAt).map((r) => ({ id: r.id, iv: r.iv, ct: r.ct })) };
    downloadText(`poetech-vault-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
  };
  const exportPlain = confirmThen('Export a PLAIN-TEXT CSV of every password? Anyone who opens that file reads them all. Delete it when you are done.', () => {
    downloadText(`poetech-vault-plain-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(items), 'text/csv');
  });

  // --- derived ------------------------------------------------------------------
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => (q ? items.filter((it) => `${it.name} ${hostOf(it.url)} ${it.username}`.toLowerCase().includes(q)) : items), [items, q]);
  const audit = useMemo(() => auditItems(items), [items]);
  const pendingCount = Object.keys(pending).length;

  // --- render -------------------------------------------------------------------
  return (
    <div>
      <SectionTitle eyebrow="Your passwords · locked on your device · kept on your own server">Vault</SectionTitle>
      <p className="text-xs text-[#5A5751] mb-3">{COVENANT}</p>

      {userId === undefined && <div className={card}><div className={labelCls}>Reading who is signed in...</div></div>}

      {userId === null && (
        <div className={card}>
          <div className={labelCls}>Sign in to open a vault</div>
          <p className="text-sm mt-1">The vault belongs to a signed-in person; it is theirs alone, and the server keeps only the locked form. Sign in and this becomes your vault.</p>
        </div>
      )}

      {userId && header === undefined && <div className={card}><div className={labelCls}>Reading your vault from the server...</div></div>}

      {userId && header === null && !key && (
        <div className={card}>
          <div className={labelCls}>No vault yet · create yours</div>
          <p className="text-sm mt-1">Choose a passphrase. Four or more unrelated words you will remember beats a short string of symbols. It is never sent anywhere.</p>
          <label className="block mt-3"><span className={labelCls}>Passphrase</span>
            <input className={fieldCls} type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} aria-label="New passphrase" /></label>
          <div className="mt-1"><Strength value={pass} /></div>
          <label className="block mt-3"><span className={labelCls}>Again</span>
            <input className={fieldCls} type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} aria-label="Repeat passphrase" /></label>
          {error && <p className="text-xs text-[#B85838] mt-2">{error}</p>}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button type="button" className={`${btnDark}`} disabled={!pass || !pass2 || !!busy} onClick={create}>Create my vault</button>
            {(!pass || !pass2) && <span className="text-xs text-[#5A5751]">Type the passphrase twice to enable this.</span>}
            {busy && <span className={chip.wait}>{busy}</span>}
          </div>
        </div>
      )}

      {userId && header && !key && (
        <div className={card}>
          <div className={labelCls}>Locked · {rows.filter((r) => !r.deletedAt).length} record{rows.filter((r) => !r.deletedAt).length === 1 ? '' : 's'}{header.createdAt ? ` · created ${String(header.createdAt).slice(0, 10)}` : ''}</div>
          <label className="block mt-3"><span className={labelCls}>Passphrase</span>
            <input className={fieldCls} type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') unlock(); }} aria-label="Passphrase" /></label>
          {error && <p className="text-xs text-[#B85838] mt-2">{error}</p>}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <button type="button" className={`${btnDark}`} disabled={!pass || !!busy} onClick={unlock}>Unlock</button>
            {!pass && <span className="text-xs text-[#5A5751]">Type your passphrase to enable this.</span>}
            {busy && <span className={chip.wait}>{busy}</span>}
          </div>
          {loadNote && <p className="text-[0.625rem] text-[#5A5751] mt-2">{loadNote}</p>}
        </div>
      )}

      {key && (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <input className={`${fieldCls} sm:w-80`} placeholder="Search site or username" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the vault" />
            <div className="flex items-center gap-1 flex-wrap">
              <button type="button" className={`${btnGhost}`} onClick={() => { setEditing({ ...EMPTY_ITEM, id: newId() }); setPanel(''); }}>+ Add</button>
              <button type="button" className={`${btnGhost}`} onClick={() => setPanel(panel === 'generate' ? '' : 'generate')}>Generate</button>
              <button type="button" className={`${btnGhost}`} onClick={() => setPanel(panel === 'import' ? '' : 'import')}>Import</button>
              <button type="button" className={`${btnGhost}`} onClick={() => setPanel(panel === 'export' ? '' : 'export')}>Export</button>
              <button type="button" className={`${btnGhost}`} onClick={() => setPanel(panel === 'audit' ? '' : 'audit')}>Audit</button>
              <button type="button" className={`${btnDark}`} onClick={lock}>Lock</button>
            </div>
          </div>
          <div className="text-[0.625rem] text-[#5A5751] mb-3 flex items-center gap-2 flex-wrap">
            <span className={chip.ok}>open · {items.length} record{items.length === 1 ? '' : 's'}</span>
            {lockedRows > 0 && <span className={chip.blocked}>{lockedRows} record{lockedRows === 1 ? '' : 's'} this passphrase cannot open</span>}
            {pendingCount > 0 && <><span className={chip.wait}>{pendingCount} saved on this device, not yet on the server</span><button type="button" className={`${btnGhost}`} onClick={retryPending}>Retry</button></>}
            {loadNote && <span>{loadNote}</span>}
            <span>locks after 5 min idle or when the tab hides</span>
            {copied && <span className={chip.ok}>copied {copied} · clears in 30 s</span>}
          </div>
          {error && <p className="text-xs text-[#B85838] mb-2">{error}</p>}

          {panel === 'generate' && (
            <div className={`${card} mb-3`}>
              <div className={labelCls}>Generate a password</div>
              <div className="flex items-center gap-3 flex-wrap mt-2 text-xs">
                <label>Length <input type="number" min="8" max="128" className={`${fieldCls} w-20 inline-block`} value={gen.length} onChange={(e) => setGen({ ...gen, length: Number(e.target.value) || 20 })} aria-label="Length" /></label>
                {['upper', 'lower', 'digits', 'symbols'].map((k) => (
                  <label key={k} className="flex items-center gap-1"><input type="checkbox" checked={gen[k]} onChange={(e) => setGen({ ...gen, [k]: e.target.checked })} /> {k}</label>
                ))}
                <button type="button" className={`${btnDark}`} onClick={() => setGen({ ...gen, out: generatePassword(gen) })}>Generate</button>
              </div>
              {gen.out && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <code className="text-sm bg-[#FAF8F4] border border-[#E8E4DC] px-2 py-1 break-all" data-testid="generated">{gen.out}</code>
                  <Strength value={gen.out} />
                  <button type="button" className={`${btnGhost}`} onClick={() => copy(gen.out, 'the password')}>Copy</button>
                  {editing && <button type="button" className={`${btnGhost}`} onClick={() => setEditing({ ...editing, password: gen.out })}>Use in the open record</button>}
                </div>
              )}
            </div>
          )}

          {panel === 'import' && (
            <div className={`${card} mb-3`}>
              <div className={labelCls}>Import from the export you already have</div>
              <p className="text-xs text-[#5A5751] mt-1">Chrome / Edge / Brave, Firefox, Bitwarden (CSV or JSON), 1Password, LastPass, KeePass, Dashlane, or any CSV with a password column. The file is read here in your browser and goes nowhere; delete the export afterward, it is plain text on your disk.</p>
              <input type="file" accept=".csv,.json,text/csv,application/json" className="mt-2 text-xs" onChange={(e) => onImportFile(e.target.files && e.target.files[0])} aria-label="Choose the export file" />
              {importPlan && importPlan.error && <p className="text-xs text-[#B85838] mt-2">{importPlan.error}</p>}
              {importPlan && !importPlan.error && !importPlan.done && (
                <div className="mt-2 text-sm">
                  <div><span className={chip.muted}>{importPlan.label}</span> {importPlan.fileName}</div>
                  <div className="mt-1">{importPlan.added.length} new · {importPlan.duplicates.length} already in your vault (skipped) · {importPlan.skipped} rows that were not logins</div>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    <button type="button" className={`${btnDark}`} disabled={!importPlan.added.length || !!busy} onClick={runImport}>Import {importPlan.added.length} record{importPlan.added.length === 1 ? '' : 's'}</button>
                    {!importPlan.added.length && <span className="text-xs text-[#5A5751]">Nothing new to import.</span>}
                    {busy && <span className={chip.wait}>{busy}</span>}
                  </div>
                </div>
              )}
              {importPlan && importPlan.done && <p className="text-sm mt-2"><span className={chip.ok}>imported {importPlan.added.length}</span> Now delete the export file from your device.</p>}
            </div>
          )}

          {panel === 'export' && (
            <div className={`${card} mb-3`}>
              <div className={labelCls}>Your data, back out</div>
              <p className="text-xs text-[#5A5751] mt-1">The encrypted backup is the one to keep: it opens only with your passphrase, and it is how you recover if the server is ever gone. The plain CSV is for moving to another manager; anyone who opens it reads everything.</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <button type="button" className={`${btnDark}`} onClick={exportEncrypted}>Encrypted backup (JSON)</button>
                <button type="button" className={`${btnGhost}`} onClick={exportPlain}>Plain CSV</button>
              </div>
            </div>
          )}

          {panel === 'audit' && (
            <div className={`${card} mb-3`}>
              <div className={labelCls}>Audit · computed on this device, nothing leaves it</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
                {[['reused', 'Reused passwords'], ['weak', 'Weak passwords'], ['old', 'Older than a year'], ['empty', 'No password']].map(([k, label]) => (
                  <div key={k} className="border border-[#E8E4DC] p-2">
                    <div className={labelCls}>{label}</div>
                    <div className="text-xl font-semibold text-[#1A1815]">{audit[k].length}</div>
                    <div className="text-[0.625rem] text-[#5A5751] break-words">{audit[k].map((id) => (items.find((i) => i.id === id) || {}).name).filter(Boolean).slice(0, 6).join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editing && (
            <div className={`${card} mb-3`} data-testid="editor">
              <div className={labelCls}>{items.some((i) => i.id === editing.id) ? 'Edit record' : 'New record'}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <label><span className={labelCls}>Name</span><input className={fieldCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} aria-label="Name" /></label>
                <label><span className={labelCls}>Site (URL)</span><input className={fieldCls} value={editing.url} onChange={(e) => setEditing({ ...editing, url: e.target.value })} aria-label="Site URL" /></label>
                <label><span className={labelCls}>Username</span><input className={fieldCls} value={editing.username} onChange={(e) => setEditing({ ...editing, username: e.target.value })} aria-label="Username" autoComplete="off" /></label>
                <label><span className={labelCls}>Password</span><input className={fieldCls} value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} aria-label="Password" autoComplete="off" /></label>
                <label className="sm:col-span-2"><span className={labelCls}>Notes</span><textarea className={fieldCls} rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} aria-label="Notes" /></label>
                <label><span className={labelCls}>TOTP secret or otpauth URL (optional)</span><input className={fieldCls} value={editing.totp} onChange={(e) => setEditing({ ...editing, totp: e.target.value })} aria-label="TOTP" autoComplete="off" /></label>
                <label className="flex items-center gap-2 text-sm mt-4"><input type="checkbox" checked={!!editing.favorite} onChange={(e) => setEditing({ ...editing, favorite: e.target.checked })} /> Favorite (sorts first)</label>
              </div>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <Strength value={editing.password} />
                <button type="button" className={`${btnGhost}`} onClick={() => setEditing({ ...editing, password: generatePassword(gen) })}>Generate a password</button>
                <button type="button" className={`${btnDark}`} disabled={!editing.name.trim()} onClick={async () => { if (await persist(editing)) setEditing(null); }}>Save</button>
                {!editing.name.trim() && <span className="text-xs text-[#5A5751]">Give the record a name to enable Save.</span>}
                <button type="button" className={`${btnGhost}`} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          )}

          {items.length === 0 && !editing && (
            <div className={card}>
              <div className={labelCls}>Your vault is open and empty</div>
              <p className="text-sm mt-1">Add a record, or Import the export from the manager you use today.</p>
            </div>
          )}

          {shown.length === 0 && items.length > 0 && <div className={card}><p className="text-sm">Nothing matches &quot;{query}&quot;.</p></div>}

          <ul className="divide-y divide-[#E8E4DC] border border-[#1A1815] bg-white" aria-label="Records">
            {shown.map((it) => (
              <li key={it.id} className="p-3 flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A1815] truncate">{it.name}{it.favorite ? <span className={`${chip.ok} ml-1`}>favorite</span> : null}</div>
                  <div className="text-[0.6875rem] text-[#5A5751] truncate">{hostOf(it.url)}{it.username ? ` · ${it.username}` : ''}{pending[it.id] ? <span className="text-[#8A6E1F]"> · not yet on the server</span> : null}</div>
                  {revealed[it.id] && <code className="block mt-1 text-sm bg-[#FAF8F4] border border-[#E8E4DC] px-2 py-1 break-all" data-testid={`password-${it.id}`}>{it.password || '(no password)'}</code>}
                  {revealed[it.id] && it.notes && <div className="mt-1 text-xs whitespace-pre-wrap">{it.notes}</div>}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {it.username && <button type="button" className={`${btnGhost}`} onClick={() => copy(it.username, 'the username')}>Copy user</button>}
                  <button type="button" className={`${btnGhost}`} onClick={() => copy(it.password, 'the password')} disabled={!it.password}>Copy password</button>
                  <button type="button" className={`${btnGhost}`} onClick={() => setRevealed((r) => ({ ...r, [it.id]: !r[it.id] }))}>{revealed[it.id] ? 'Hide' : 'Reveal'}</button>
                  <button type="button" className={`${btnGhost}`} onClick={() => { setEditing({ ...EMPTY_ITEM, ...it }); setPanel(''); }}>Edit</button>
                  <button type="button" className={`${btnGhost}`} onClick={confirmThen(`Delete "${it.name}" from your vault?`, () => remove(it.id))}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
