// =============================================================================
// StoreSigningKey — the Dev/Ops card that gives the store a stable identity
// =============================================================================
// Darrell 2026-07-23: "How can we build this into the Apps so Dev/Ops members
// can do that step and still stay secure?" The flow (lib/store-signing.js):
// key born in this browser → Governor's vault download FIRST (custody,
// DR-0152) → the member's own fine-grained GitHub token (in memory only,
// never stored) places the sealed secrets → the android lane is dispatched
// and its own log line is the receipt (DR-0076). The PLAY keystore stays a
// separate offline Governor step — this is the STORE key only.
import React, { useState } from 'react';
import { generateStoreKeystore, placeStoreSigningKey, PAT_INSTRUCTIONS, SECRET_NAMES, REPO } from '../lib/store-signing.js';

const btn = 'text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[36px] inline-flex items-center focus:outline focus:outline-2';
const solid = `${btn} bg-[#B85838] text-white font-semibold hover:bg-[#1A1815] focus:outline-[#1A1815] disabled:opacity-40`;
const ghost = `${btn} border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline-[#B85838]`;

export default function StoreSigningKey() {
  const [busy, setBusy] = useState(false);
  const [ks, setKs] = useState(null);        // { p12Base64, password }
  const [vaulted, setVaulted] = useState(false);
  const [token, setToken] = useState('');
  const [placed, setPlaced] = useState(null); // result of placeStoreSigningKey
  const [error, setError] = useState('');

  const generate = async () => {
    setBusy(true); setError('');
    try { setKs(await generateStoreKeystore({})); }
    catch (e) { setError(`Key generation failed: ${e?.message || 'unknown'}`); }
    setBusy(false);
  };

  const download = () => {
    const bytes = Uint8Array.from(atob(ks.p12Base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/x-pkcs12' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'poetech-store.keystore.p12'; a.click();
    URL.revokeObjectURL(url);
    setVaulted(true);
  };

  const place = async () => {
    setBusy(true); setError('');
    try {
      const r = await placeStoreSigningKey({ p12Base64: ks.p12Base64, password: ks.password, token });
      setPlaced(r);
      if (!r.ok) setError(`Placement stopped at ${r.results.at(-1)?.step || 'secret'} (HTTP ${r.results.at(-1)?.status}) — check the token's scopes.`);
    } catch (e) { setError(`Placement failed: ${e?.message || 'network'}`); }
    setToken(''); // the token is used once and dropped, success or not
    setBusy(false);
  };

  return (
    <section className="bg-white border border-[#1A1815] p-4">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Store signing key</div>
      <p className="text-xs text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        Give the App Store's Android packages a <strong>stable identity</strong> so updates install in place (today's testing key forces uninstall/reinstall). The key is born in <strong>this browser</strong>, vaulted by the Governor first, and placed with <strong>your own</strong> GitHub authority — nothing is stored here, and the Play keystore stays a separate offline Governor step (DR-0152).
      </p>

      {!ks && (
        <button type="button" className={`${solid} mt-2`} onClick={generate} disabled={busy}>
          {busy ? 'Generating in this browser…' : '1 · Generate the key (client-side)'}
        </button>
      )}

      {ks && (
        <div className="mt-2 space-y-2">
          <div className="text-[0.6875rem] text-[#1A1815]">
            Key generated in this browser (alias <code>poetech</code>). <strong>Custody first:</strong> download it and record the password in the Governor's vault — this is the only moment it exists to save.
          </div>
          <div className="text-[0.6875rem] border border-[#E8E4DC] p-2 break-all">
            Password: <code>{ks.password}</code>
          </div>
          <button type="button" className={vaulted ? ghost : solid} onClick={download}>
            {vaulted ? 'Downloaded ✓ (download again)' : '2 · Download for the vault'}
          </button>

          {vaulted && !placed?.ok && (
            <div className="space-y-1.5">
              <div className="text-[0.6875rem] text-[#1A1815] font-semibold">3 · Place it with your own GitHub authority</div>
              <ol className="list-decimal ml-4 text-[0.6875rem] text-[#5A5751] space-y-0.5">
                {PAT_INSTRUCTIONS.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              <input
                type="password" autoComplete="off" value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the fine-grained token (used once, never stored)"
                className="w-full text-xs border border-[#1A1815] px-2 py-1.5 min-h-[36px] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
              />
              <button type="button" className={solid} onClick={place} disabled={busy || token.length < 20}>
                {busy ? 'Sealing + placing…' : `Place ${SECRET_NAMES.length} secrets on ${REPO.owner}/${REPO.repo} + prove`}
              </button>
            </div>
          )}

          {placed?.ok && (
            <div className="text-[0.6875rem] text-[#166534]">
              ✓ Both secrets placed under your GitHub identity{placed.proofDispatched ? ' · proof build dispatched — its log will read "Signing with the persistent store keystore."' : ' · dispatch the Android lane to prove the signature.'} Future builds update in place. (Phones with the old testing-key apps do one last uninstall/reinstall.)
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[0.6875rem] text-[#B85838] mt-2">{error}</p>}
    </section>
  );
}
