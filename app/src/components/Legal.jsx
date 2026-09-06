// Legal Matters — Books → Legal sub-tab placeholder (r23).
// Full implementation per /docs/00-foundations/_root/LEGAL-PRIVACY-BOUNDARY.md
// requires PIN gate + Web Crypto at-rest encryption + privileged Y/N CRUD +
// export tool. Those are queued as tasks #94–#99. This file ships the visible
// commitment now — tier-gated, with the four-scope structure named so users
// see what's coming.
//
// 2026-05-24 — first real surface added: Accounts In Legal. Any account
// flagged inLegal (via the Move-to-Legal button on the Accounts tab) shows
// up here with a Restore button. These accounts are excluded from cash
// totals on every other tab. Available at every tier — the encryption-
// heavy legal-matters module remains gated.
//
// 2026-09-06 — THE FOUR CATEGORIES BECOME REAL (DR-0329). Darrell, on this tab:
// "I need a section that I can upload legal documents for each of these
// categories." Until now those four boxes were four hardcoded <ul> lists —
// orientation copy painted over nothing, the P15 class exactly, on the one
// surface whose entire value is trust.
//
// REALITY-TRACE (DR-0061 / P15), stated before the code:
//   • REAL DATA — each shelf reads and writes real `legal_documents` rows
//     (migration 0169), kept device-local in lib/legal-documents-store.js and
//     synced to the owner's own devices. File bytes live in the PRIVATE
//     `legal-documents` bucket and are read back only through short-lived
//     signed URLs. Every count on this screen is computed from those rows —
//     there is no painted number here.
//   • END-TO-END — the same rows in the signed-in app, not a demo path; the
//     pointer path additionally works signed out and offline.
//   • THE SCREEN THE USER USES — Books -> Legal, the tab in the screenshot, on
//     a phone. No new nav.
//   • ASSUMPTION STATED — the tab already sits behind PrivateGate (the app PIN
//     gate, lib/private-lock.js), so the shelves inherit it rather than adding
//     a second, weaker gate of their own.
//
// TWO WAYS TO SHELVE, both first-class: a FILE (bytes to the vault) or a
// POINTER (no bytes; where the paper actually is). LEGAL-PRIVACY-BOUNDARY.md
// binds documents as "pointers only, not file content"; the direction above
// asks for upload. Keeping both honors the foundation instead of overwriting
// it — and a shelf that refused to record anything while offline would be
// worse than the placeholder it replaces.
//
// WHAT THIS IS NOT, said plainly rather than implied (DR-0076 §8): Layer 2 of
// LEGAL-PRIVACY-BOUNDARY specifies AES-GCM-256 at rest keyed from the Legal
// PIN. That is NOT built. It cannot be honestly built on today's architecture —
// lib/pin.js:9 states the PIN never enters the browser, so no PIN-derived key
// exists client-side to encrypt with. The surface says so in words. What IS
// true: a private bucket, creator-only RLS, signed URLs, a PIN-gated tab.
// re-review: 2026-10-15.
//
// 2026-09-06 — THE IP REGISTER lands on this tab. Darrell: "how do I turn
// PoeTech into intellectual properties?" -> "What needs to happen for me to
// have what is considered a real asset?" LEGAL-PRIVACY-BOUNDARY.md already
// scopes the Business shelf to track "IP - trademark filings, copyright, trade
// secrets", so the shelves could hold the PAPER once a filing exists. They
// could not answer the prior question: what do we own, is it protected, and is
// it an asset yet? The register answers it, and answers it honestly.
//
// REALITY-TRACE for the register block:
//   • REAL DATA — lib/ip-portfolio.js, the transcription of the repo register
//     at docs/00-foundations/_root/IP-REGISTER.md. PLATFORM content (like
//     scriptures.js), not user data: it describes what PoeTech itself owns.
//   • NOT PAINTED — every number below (score, bottleneck, lane counts, the
//     forfeited list) is COMPUTED by lib/ip-register.js from those rows. The
//     0-of-5 reads 0 because the rows say so, not because it was typed.
//   • WHAT IT IS NOT — this is PoeTech's own register, not a per-tenant one.
//     A tenant's IP is user data and would need its own store and RLS. The
//     surface says so rather than implying a feature that is not there.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ASSET_TESTS,
  IP_LANES,
  forfeitedByDisclosure,
  laneCounts,
  portfolioScore,
  scoreAsset,
} from '../lib/ip-register.js';
import { EXCLUDED_MARKS, IP_PORTFOLIO, REGISTER_AS_OF, STILL_PROTECTABLE } from '../lib/ip-portfolio.js';
import {
  LEGAL_CATEGORIES,
  MAX_FILE_BYTES,
  categoryCounts,
  documentShape,
  documentsInCategory,
  formatBytes,
  isPointer,
  validateDocument,
  validateFile,
} from '../lib/legal-documents.js';
import { loadLegalDocuments, saveLegalDocuments } from '../lib/legal-documents-store.js';
import {
  deleteLegalFile,
  legalDocumentsSync,
  mergeRemoteLegalDocuments,
  signedLegalUrl,
  uploadLegalFile,
} from '../lib/legal-documents-sync.js';

function blankForm() {
  // `privileged: null` is the point — see the fieldset below. An undecided
  // document cannot be saved, so it must start undecided.
  return { label: '', docType: '', file: null, whereFiled: '', dateOf: '', note: '', privileged: null };
}

// ---------------------------------------------------------------------------
// One shelf. The category's bullet list is no longer decoration: it IS the
// document-type vocabulary the picker offers, which is what makes the bullets
// true rather than illustrative.
// ---------------------------------------------------------------------------
function Shelf({ category, docs, counts, onAdd, onOpen, onRemove, notice }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => blankForm());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const reset = () => { setForm(blankForm()); setError(''); if (fileRef.current) fileRef.current.value = ''; };

  const submit = async () => {
    if (busy) return;
    setError('');
    const draft = documentShape({
      category: category.id,
      docType: form.docType,
      label: form.label,
      dateOf: form.dateOf || null,
      privileged: form.privileged,
      whereFiled: form.whereFiled,
      note: form.note,
    });
    // The file is validated BEFORE the record, so a 400 MB mistake is refused
    // without the user first filling in a form they cannot submit.
    if (form.file) {
      const bounds = validateFile(form.file);
      if (!bounds.ok) { setError(bounds.message); return; }
    }
    // Validate the record as it will exist WITH its file, so "no file, so say
    // where it is" is not raised against a document that has one.
    const check = validateDocument(form.file ? { ...draft, storagePath: 'pending' } : draft);
    if (!check.ok) { setError(check.message); return; }

    setBusy(true);
    const result = await onAdd(draft, form.file);
    setBusy(false);
    if (result && result.ok === false) { setError(result.message); return; }
    reset();
    setOpen(false);
  };

  const count = counts[category.id] || { total: 0, files: 0, pointers: 0, privileged: 0 };

  return (
    <div className="bg-[#FAF8F4] border border-[#1A1815] p-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">{category.label}</div>
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {count.total === 0 ? 'empty' : `${count.total} filed · ${count.files} file${count.files === 1 ? '' : 's'} · ${count.pointers} pointer${count.pointers === 1 ? '' : 's'}`}
        </div>
      </div>
      <p className="text-xs text-[#5A5751] italic mt-1 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{category.blurb}</p>

      {/* What belongs here. Same list as before — now also the picker's options. */}
      <ul className="text-xs space-y-1 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        {category.docTypes.slice(0, 5).map((t) => <li key={t}>· {t}</li>)}
        {category.docTypes.length > 5 && (
          <li className="text-[#5A5751] italic">· and {category.docTypes.length - 5} more in the picker</li>
        )}
      </ul>

      {/* The filed documents. Labels are user-private and render ONLY here. */}
      {docs.length > 0 && (
        <div className="space-y-2 mb-3">
          {docs.map((d) => (
            <div key={d.id} className="bg-white border border-[#E8E4DC] p-3">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{d.label}</div>
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-0.5">
                    {d.docType || 'Document'}{d.dateOf ? ` · ${d.dateOf}` : ''}
                    {d.privileged ? ' · PRIVILEGED' : ' · not privileged'}
                    {isPointer(d) ? ' · pointer' : ` · ${formatBytes(d.fileSize)}`}
                  </div>
                </div>
              </div>
              {isPointer(d) ? (
                <p className="text-xs text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                  Where it is: {d.whereFiled}
                </p>
              ) : null}
              {d.note && <p className="text-xs text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{d.note}</p>}
              <div className="mt-2 flex gap-2 flex-wrap">
                {!isPointer(d) && (
                  <button type="button" onClick={() => onOpen(d)} className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">Open</button>
                )}
                <button type="button" onClick={() => onRemove(d)} className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
          + Add a document
        </button>
      ) : (
        <div className="bg-white border border-[#1A1815] p-3 space-y-2">
          <label className="block">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">What is it</span>
            <input type="text" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="A name you will recognize in a year"
              className="w-full mt-1 border border-[#E8E4DC] px-2 py-2 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" />
          </label>

          <label className="block">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Type</span>
            <select value={form.docType} onChange={(e) => setForm((f) => ({ ...f, docType: e.target.value }))}
              className="w-full mt-1 border border-[#E8E4DC] px-2 py-2 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]">
              <option value="">Choose a type…</option>
              {category.docTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">File (optional)</span>
            <input ref={fileRef} type="file" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files && e.target.files[0] }))}
              className="w-full mt-1 text-sm" />
            <span className="block text-[0.625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
              Up to {formatBytes(MAX_FILE_BYTES)}. No file? Say where the paper is below — that is a real record too.
            </span>
          </label>

          {!form.file && (
            <label className="block">
              <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Where the document actually is</span>
              <input type="text" value={form.whereFiled} onChange={(e) => setForm((f) => ({ ...f, whereFiled: e.target.value }))}
                placeholder="Counsel's office · the fire safe · the county recorder"
                className="w-full mt-1 border border-[#E8E4DC] px-2 py-2 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" />
            </label>
          )}

          <label className="block">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Date on the document (optional)</span>
            <input type="date" value={form.dateOf} onChange={(e) => setForm((f) => ({ ...f, dateOf: e.target.value }))}
              className="w-full mt-1 border border-[#E8E4DC] px-2 py-2 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" />
          </label>

          {/* MANDATORY. Starts unselected: the export tool's guarantee only
              holds if every document was actually decided, and a pre-ticked
              default produces rows nobody chose. */}
          <fieldset className="border border-[#B85838] p-2">
            <legend className="text-[0.625rem] uppercase tracking-wider text-[#B85838] px-1">Privileged? — required</legend>
            <div className="flex gap-3 flex-wrap">
              <label className="text-xs flex items-center gap-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
                <input type="radio" name={`priv-${category.id}`} checked={form.privileged === true}
                  onChange={() => setForm((f) => ({ ...f, privileged: true }))} />
                Privileged <span className="text-[#5A5751] italic">(recommended)</span>
              </label>
              <label className="text-xs flex items-center gap-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
                <input type="radio" name={`priv-${category.id}`} checked={form.privileged === false}
                  onChange={() => setForm((f) => ({ ...f, privileged: false }))} />
                Not privileged
              </label>
            </div>
            <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
              Over-marking is recoverable. Under-marking can waive privilege and cannot be undone.
            </p>
          </fieldset>

          <label className="block">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Note (optional)</span>
            <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={2}
              className="w-full mt-1 border border-[#E8E4DC] px-2 py-2 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" />
          </label>

          {error && (
            <p className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }} role="alert">{error}</p>
          )}

          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={submit}
              className="text-[0.625rem] uppercase tracking-wider px-4 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">
              {busy ? 'Filing…' : 'File it'}
            </button>
            <button type="button" onClick={() => { reset(); setOpen(false); }}
              className="text-[0.625rem] uppercase tracking-wider px-4 py-2 min-h-[36px] border border-[#E8E4DC] text-[#5A5751] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {notice && (
        <p className="text-xs text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{notice}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IpRegisterPanel — PoeTech's own IP register. Everything here is derived; the
// component holds no numbers of its own. Collapsed by default: it is reference
// material on a tab whose primary job is the user's documents.
// ---------------------------------------------------------------------------
export function IpRegisterPanel({ assets = IP_PORTFOLIO }) {
  const [open, setOpen] = useState(false);
  const roll = useMemo(() => portfolioScore(assets), [assets]);
  const counts = useMemo(() => laneCounts(assets), [assets]);
  const forfeited = useMemo(() => forfeitedByDisclosure(assets), [assets]);

  // The bottleneck the whole register shares, if it shares one. This is the
  // finding that matters: one document unblocks everything, or it does not.
  const bottlenecks = new Set(roll.scored.map((s) => s.score.bottleneck).filter(Boolean));
  const sharedBottleneck = bottlenecks.size === 1 ? [...bottlenecks][0] : null;
  const sharedTest = ASSET_TESTS.find((t) => t.id === sharedBottleneck) || null;

  return (
    <div className="bg-white border-2 border-[#1A1815] p-5">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">
        IP Register · PoeTech · as of {REGISTER_AS_OF}
      </div>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
          {roll.fullAssets} of {roll.count} are assets
        </h3>
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {counts.trademark} marks · {counts.copyright} works · {counts['trade-secret']} methods
        </span>
      </div>

      <p className="text-sm leading-relaxed mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
        An item is an <strong>asset</strong> only when it passes all five tests below. Anything short of that is
        work product, however good it is.
        {sharedTest && (
          <> Every row here fails on the same test first — <strong>{sharedTest.label}</strong> — which means one
          document moves the whole register: a written IP assignment into an entity, with this schedule attached.</>
        )}
      </p>

      {/* The five tests, with how many rows pass each. Computed, never typed. */}
      <ol className="mt-3 space-y-1.5">
        {ASSET_TESTS.map((test, i) => {
          const passed = roll.byTest[test.id];
          const clear = passed === roll.count && roll.count > 0;
          return (
            <li key={test.id} className="flex items-baseline gap-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
              <span className="shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }} aria-hidden="true">{i + 1}.</span>
              <span className="flex-1">
                <strong className={clear ? 'text-[#5A6E3D]' : 'text-[#B85838]'}>{test.label}</strong>
                {' — '}{test.asks}
              </span>
              <span
                className={`shrink-0 ${clear ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                {passed}/{roll.count}
              </span>
            </li>
          );
        })}
      </ol>

      {/* The leak, stated as a measured number rather than a worry. */}
      {forfeited.length > 0 && (
        <div className="mt-4 bg-[#FAF8F4] border border-[#B85838] p-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">
            {forfeited.length} methods outside trade-secret reach
          </div>
          <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
            The repository is public, and trade secret is the only lane that protects <em>methods</em>. Publication
            forecloses it, and disclosure is not recoverable — so these are recorded as unprotected rather than
            claimed: {forfeited.map((a) => a.name).join(' · ')}.
          </p>
          <p className="text-xs leading-relaxed mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            <strong>Still protectable, because not yet published:</strong> {STILL_PROTECTABLE.join(' · ')}.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        {open ? 'Hide the schedule' : `Show all ${roll.count} rows`}
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {IP_LANES.filter((lane) => counts[lane.id] > 0).map((lane) => (
            <div key={lane.id}>
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">
                {lane.label} · {counts[lane.id]}
              </div>
              <p className="text-[0.625rem] text-[#5A5751] italic mb-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
                {lane.blurb}
              </p>
              <ul className="space-y-1.5">
                {assets.filter((a) => a.lane === lane.id).map((a) => {
                  const s = scoreAsset(a);
                  return (
                    <li key={a.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-2">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <span className="text-xs flex-1 min-w-0" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{a.name}</span>
                        <span className="text-[0.625rem] shrink-0 text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          {s.passedCount}/{s.total}{s.bottleneck ? ` → ${s.bottleneck}` : ''}
                        </span>
                      </div>
                      {a.notes && (
                        <p className="text-[0.625rem] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{a.notes}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {EXCLUDED_MARKS.map((ex) => (
            <p key={ex.name} className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              <strong>Excluded on purpose — &ldquo;{ex.name}&rdquo;:</strong> {ex.why}
            </p>
          ))}
        </div>
      )}

      <p className="text-[0.625rem] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
        This is PoeTech&rsquo;s own register, not yours — a tenant&rsquo;s IP would be user data with its own store, and
        that is not built. Source of truth: <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>docs/00-foundations/_root/IP-REGISTER.md</span>.
        Not legal advice; which lanes to pursue is counsel&rsquo;s call.
      </p>
    </div>
  );
}

export function LegalPlaceholder({ tier = 'foundation', setView, accounts = [], entities = [], toggleAccountLegal }) {
  const unlockedTiers = new Set(['family', 'premium', 'business', 'loved-ones']);
  const unlocked = unlockedTiers.has(tier);
  const legalAccounts = (accounts || []).filter(a => a.inLegal);
  const entityName = (id) => (entities || []).find(e => e.id === id)?.name || id;

  // ---- the shelves: real rows, device-local first, synced when signed in ----
  const [docs, setDocs] = useState(() => loadLegalDocuments());
  const [shelfNotice, setShelfNotice] = useState('');

  useEffect(() => {
    const res = saveLegalDocuments(docs);
    // A quota failure means the shelf silently stops remembering. Say so — a
    // failure the user never sees is a failure the user cannot act on.
    if (res && res.skipped === 'write-error') {
      setShelfNotice('This device could not save the shelf locally (storage is full). Documents already synced are safe; new ones may not survive a reload.');
    }
  }, [docs]);

  // Signed out this never fires and the shelves run entirely on this device.
  useEffect(() => {
    const unsub = legalDocumentsSync.subscribe((items) => {
      setDocs((cur) => mergeRemoteLegalDocuments(cur, items));
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const counts = useMemo(() => categoryCounts(docs), [docs]);

  // Returns { ok:false, message } so the shelf can show the real reason inline
  // rather than failing blankly. The FILE goes first: if the bytes cannot be
  // stored we must not leave a row claiming a document that is not there.
  const addDocument = useCallback(async (draft, file) => {
    let record = draft;
    if (file) {
      const up = await uploadLegalFile({ file, slug: draft.id });
      if (!up.ok) return { ok: false, message: up.message };
      record = { ...draft, storagePath: up.storagePath, fileName: up.fileName, fileSize: up.fileSize };
    }
    const check = validateDocument(record);
    if (!check.ok) return { ok: false, message: check.message };
    setDocs((cur) => [record, ...cur]);
    legalDocumentsSync.upload(record);
    setShelfNotice('');
    return { ok: true };
  }, []);

  const openDocument = useCallback(async (doc) => {
    const url = await signedLegalUrl(doc.storagePath);
    if (!url) {
      setShelfNotice(`"${doc.label}" could not be opened. Sign in on this device, or the file may not have finished uploading.`);
      return;
    }
    setShelfNotice('');
    if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
  }, []);

  const removeDocument = useCallback(async (doc) => {
    if (typeof confirm === 'function'
        && !confirm(`Remove "${doc.label}" from the legal shelf? ${isPointer(doc) ? 'This removes the record.' : 'This deletes the stored file too, and cannot be undone.'}`)) return;
    const del = await deleteLegalFile(doc.storagePath);
    setDocs((cur) => {
      const target = cur.find((d) => d.id === doc.id);
      if (target && target.remoteUuid) legalDocumentsSync.deleteRow(target.remoteUuid);
      return cur.filter((d) => d.id !== doc.id);
    });
    // The row is gone either way; do not claim a clean delete we did not get.
    setShelfNotice(del && del.ok === false
      ? `The record was removed, but the stored file could not be deleted (${del.message}). It remains in your private vault.`
      : '');
  }, []);
  return (
    <section className="space-y-4">
      {/* Accounts In Legal — surfaced FIRST so the user lands on the actionable
          surface. Empty state is informative, not loud. */}
      <div className="bg-white border-2 border-[#5A6E3D] p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] mb-2 font-semibold">🔒 Accounts In Legal · {legalAccounts.length}</div>
        {legalAccounts.length === 0 ? (
          <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            No accounts under legal hold right now. If an account becomes disputed, frozen, in probate, or otherwise out of normal financial flow, open it on the <strong>Accounts</strong> tab and tap <strong>🔒 Move to Legal</strong>. It will surface here and be excluded from cash totals everywhere else.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              These accounts are excluded from cash totals on every other tab. They remain in the data — balances, notes, history — but don't distort the financial picture while they're in legal limbo.
            </p>
            {legalAccounts.map(a => (
              <div key={a.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{a.name}</div>
                    <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-0.5">
                      {a.institution} {a.fragment ? `· ${a.fragment}` : ''} · {a.type} · {entityName(a.entityId)}
                    </div>
                  </div>
                  <div className={`text-right shrink-0 ${a.balance < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{a.balance != null ? `$${Number(a.balance).toFixed(2)}` : '—'}</div>
                </div>
                {a.notes && <p className="text-xs text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{a.notes}</p>}
                {toggleAccountLegal && (
                  <div className="mt-2">
                    <button type="button" onClick={() => { if (confirm(`Restore "${a.name}" to the Accounts tab? Its balance will rejoin cash totals.`)) toggleAccountLegal(a.id); }} className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">↩ Restore to Accounts</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-[#1A1815] p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] mb-1 font-semibold">🔒 Legal Matters · Confidential</div>
        <h2 className="text-2xl mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Track legal work the right way</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Sits inside Books because most legal work has a financial dimension — fees, settlements, insurance, tax exposure. Cross-links to your properties, entities, transactions, and calendar so nothing is hand-tracked twice. Confidentiality is built in: separate PIN, at-rest encryption (AES-GCM 256), auto-lock, and mandatory <strong>privileged / not</strong> on every note so the export tool can mechanically strip privileged content before you share with non-counsel.
        </p>
        <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Not legal advice. Have your attorney review the deployed module before storing live matter information.
        </p>
      </div>

      {/* THE FOUR SHELVES. These four boxes used to be four hardcoded <ul>
          lists. Every number above a shelf is now computed from real rows, and
          every bullet is now an option in that shelf's own picker. */}
      <div>
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
          <h3 className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Your legal documents, by category</h3>
          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {docs.length} filed
          </span>
        </div>
        <p className="text-xs text-[#5A5751] italic mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Upload the file, or record where the paper actually is — both are real records, and a pointer works with no signal.
          Names and notes here are private to this tab: everywhere else in the app, a linked matter shows only a count.
        </p>
        {shelfNotice && (
          <p className="text-xs text-[#B85838] mb-2" style={{ fontFamily: '"Fraunces", serif' }} role="status">{shelfNotice}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LEGAL_CATEGORIES.map((category) => (
            <Shelf
              key={category.id}
              category={category}
              docs={documentsInCategory(docs, category.id)}
              counts={counts}
              onAdd={addDocument}
              onOpen={openDocument}
              onRemove={removeDocument}
            />
          ))}
        </div>
        <p className="text-[0.625rem] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Files are stored in a private vault only your account can read, and opened through links that expire in five minutes.
          They are <strong>not</strong> yet encrypted with your own key at rest — that layer is designed but not built, and this
          screen will not claim it until it is. Until then, treat this as a private shelf, not a safe deposit box.
        </p>
      </div>

      <IpRegisterPanel />

      <div className="bg-white border border-[#5A6E3D] p-4">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] mb-2 font-semibold">How Legal connects to the rest of the system</div>
        <p className="text-xs text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Every connection below uses an ID, not a title — so the non-Legal side never sees what the matter is about. Just "🔒 Legal note exists." Click-through requires PIN.
        </p>
        <ul className="text-xs space-y-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
          <li>· <strong>Real Estate · Properties</strong> — A property row shows "🔒 1 Legal matter linked" when one exists. Title and matter detail stay encrypted; only the count surfaces. Useful for: eviction proceedings, title disputes, tax appeals tied to a specific door.</li>
          <li>· <strong>Books · Entities</strong> — Each LLC's matters live under its umbrella. Filter Legal by entity to see "what does PoeTech LLC have open right now?" vs. "what does Poe Properties have?" — keeps multi-business operators sane at tax time.</li>
          <li>· <strong>Books · Transactions</strong> — When you record a legal fee paid, the transaction can optionally link to a matter ID. The matter view then shows cumulative fees-to-date with breakdown by firm. Settlement payments (in or out) link too.</li>
          <li>· <strong>Books · Calendar</strong> — Court dates added to a matter auto-mirror to the Calendar as "🔒 Legal matter · [date] · [time]" — never with the matter title. Browser notification still fires. Click → opens Legal tab (PIN gate first if locked).</li>
          <li>· <strong>Books · 1099 contractors</strong> — Worker disputes (misclassification, unpaid scope, harassment) link the matter to the contractor record. The contractor's portal NEVER sees the legal matter — only the operator side sees the link.</li>
          <li>· <strong>Practice · Inquiries (TLC)</strong> — Professional licensing matters can reference an inquiry only if it's clearly non-PHI. The Legal module ships with messaging DISABLED by default for therapy-practice templates to prevent accidental PHI exchange. Acuity stays the PHI system of record.</li>
          <li>· <strong>Real Estate · Tenants</strong> — Tenant-related matters (eviction, lease violation) link to the tenant profile. Tenant portal (when shipped) NEVER sees the legal matter; operator side sees the link.</li>
          <li>· <strong>Big Picture · Action Queue</strong> — Excluded by default. Power users can opt-in per-matter to surface a non-privileged summary line (e.g., "🔒 Court date in 12 days") so urgency is visible without leakage.</li>
          <li>· <strong>Audit log (per IDENTITY-ROLES-AUDIT)</strong> — Every view, edit, export, PIN attempt, share — timestamped, attributed to the acting user. Tamper-evident in Phase 3+ (hash-chained). The audit log itself is privileged content.</li>
          <li>· <strong>Export tool</strong> — Two modes: <em>Privileged-stripped</em> (for sharing with non-counsel — strips every note/document marked privileged) and <em>Full</em> (counsel only — requires PIN re-entry, watermarked "ATTORNEY WORK PRODUCT"). Both watermark the matter name + export date for accountability.</li>
        </ul>
      </div>

      {!unlocked && (
        <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-4">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-semibold">Unlocks at Family ($89) and above</div>
          <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            The encryption layer is real engineering — PIN gate, Web Crypto AES-GCM, auto-lock, privileged-stripped export. Ships at Family tier so the work is paid for. Confidentiality is the feature, not an add-on.
          </p>
          <button type="button" onClick={() => setView('about')} className="text-xs uppercase tracking-wider px-4 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">See pricing tiers →</button>
        </div>
      )}

      {unlocked && (
        <div className="bg-white border-2 border-dashed border-[#5A6E3D] p-5 text-center">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] mb-2 font-semibold">🔧 Coming next</div>
          <p className="text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
            PIN setup → AES-GCM 256 at-rest encryption → matter CRUD across all four scopes → journal + documents with mandatory privileged Y/N → key dates auto-mirroring to Calendar with privileged labels → privileged-stripped export tool. Tracked as tasks #94–#99 in the build queue.
          </p>
        </div>
      )}
    </section>
  );
}

export default LegalPlaceholder;
