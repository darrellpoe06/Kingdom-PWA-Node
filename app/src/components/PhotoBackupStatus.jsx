// =============================================================================
// PhotoBackupStatus — the photo-backup road, as it stands right now (DR-1120)
// =============================================================================
// Shown on the Infra Plan inside "Open-source tools, weighed", beside the
// Immich row, so the service DR-1119 named is seen where it was weighed. Reads
// the road's own /health (never a painted status) and shows the NAS's reason
// verbatim when it is not ready. The phone steps are the Immich app's own, and
// the one value a phone needs from this device, the family key, is copied from
// here rather than retyped.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { photoBackupHealth, PHONE_STEPS, PHONE_SERVER_URL, KEY_HEADER, LIBRARY_PATH } from '../lib/photo-backup.js';
import { bridgeToken, hasBridgeToken } from '../lib/nas-photos.js';
import { provisionBridgeToken } from '../lib/bridge-provision.js';
import { supabase } from '../lib/supabase.js';

const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const btnCls = 'min-h-[36px] px-3 text-[0.6875rem] uppercase tracking-wider border border-[#1A1815] bg-white text-[#1A1815] disabled:text-[#5A5751] disabled:border-[#C9C2B6] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#1A1815]';

export default function PhotoBackupStatus({ fetchImpl, client = supabase, clipboard = (typeof navigator !== 'undefined' ? navigator.clipboard : null) }) {
  const [health, setHealth] = useState({ state: 'checking' });
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    let live = true;
    photoBackupHealth(fetchImpl ? { fetchImpl } : undefined).then((h) => { if (live) setHealth(h); });
    provisionBridgeToken(client);
    return () => { live = false; };
  }, [fetchImpl, client]);

  async function copyKey() {
    const key = bridgeToken();
    if (!key || !clipboard || typeof clipboard.writeText !== 'function') { setCopied('This device has no family key yet. Open the Cameras tab once while signed in, then try again.'); return; }
    try { await clipboard.writeText(key); setCopied('Copied. Paste it as the header’s value in the Immich app.'); }
    catch { setCopied('The browser would not copy it; open the Cameras tab and copy the key from there.'); }
  }

  return (
    <div className="mt-3 border border-[#1A1815] p-3" aria-labelledby="photo-backup-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id="photo-backup-title" className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Immich: the phones’ photos, backed up at home</h4>
        <span role="status" className="text-[0.6875rem] text-[#5A5751]">
          {health.state === 'checking' && 'Checking the road…'}
          {health.state === 'live' && `Live on the NAS · Immich ${health.version}${health.freeGb != null ? ` · ${health.freeGb} GB free on the pool` : ''}`}
          {health.state === 'dark' && `Not ready: ${health.reason}`}
          {health.state === 'unreachable' && health.reason}
        </span>
      </div>
      <p className="mt-2 text-[0.75rem] text-[#5A5751]">
        Every new photo and video on a phone lands in <code className="text-[#1A1815]">{LIBRARY_PATH}</code> on the NAS pool, as plain folders that outlive the app. Nothing is uploaded until a phone is set up; the pick-and-verify backup on the Big Picture stays as it is.
      </p>
      <div className={`${labelCls} mt-2`}>Set up a phone, once</div>
      <ol className="mt-1 list-decimal pl-5 space-y-1 text-[0.75rem] text-[#1A1815]">
        {PHONE_STEPS.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={copyKey} disabled={!hasBridgeToken()} className={btnCls}>Copy the family key</button>
        <span className="text-[0.6875rem] text-[#5A5751]">header <code>{KEY_HEADER}</code> · server <code className="break-all">{PHONE_SERVER_URL}</code></span>
      </div>
      {copied && <p role="status" className="mt-1 text-[0.6875rem] text-[#5A5751]">{copied}</p>}
    </div>
  );
}
