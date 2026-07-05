// =============================================================================
// PhoneBackup — "move this phone's photos & videos to the NAS" card (Big Picture)
// =============================================================================
// 2026-07-05, Darrell: "Can this app upload and give me the option of moving
// all my photos and videos to my server or nas ... so I can get a new phone
// and all my images and videos are safe?" This card is the answer surface:
// pick files or a whole folder, watch them stream to the NAS in resumable
// chunks, and see a VERIFIED count (bytes confirmed by the NAS, DR-0076) —
// so "safe to switch phones" is a measured statement, not a vibe.
//
// Reality-trace (Layer-0 rule): the real data is the file tree at
// /volume1/PoeTech/phone-backup/<device>/<YYYY>/<MM>/ on the family NAS,
// written by infra/nas-property-photos/photo_server.py via the same-origin
// /nas-photos path; the local ledger (media-backup.js) mirrors only what the
// NAS verified. Fail states are stated honestly: no bridge token → the card
// renders nothing (same fail-quiet contract as every NAS surface); NAS
// reachable but running the pre-media build → the card says the one-line
// redeploy is needed instead of pretending.
//
// HONEST LIMIT, stated on the card: a PWA cannot background-sync the camera
// roll (browser sandbox — 2026-06-11-photo-sovereignty-and-phone-backup.md).
// This is the pick-and-verify lane; automatic every-new-shot backup is the
// Synology Photos app's job.
import React, { useEffect, useRef, useState } from 'react';
import { hasBridgeToken } from '../lib/nas-photos.js';
import {
  isMediaFile, isBackedUp, backedUpCount, uploadMedia, checkMediaService,
  deviceLabel, setDeviceLabel, MAX_MEDIA_BYTES,
} from '../lib/media-backup.js';
import UiIcon from './UiIcon.jsx';

const fmtBytes = (n) => {
  if (!Number.isFinite(n) || n <= 0) return '0 MB';
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(n / 1024 ** 2))} MB`;
};

// Recursively collect media files from a picked directory (Android Chrome/Edge
// File System Access API). Depth-bounded; skips hidden + Synology system dirs.
async function collectMediaFiles(dir, depth, out) {
  for await (const entry of dir.values()) {
    if (entry.kind === 'file') {
      if (isMediaFile(entry.name)) out.push(entry);
    } else if (entry.kind === 'directory' && depth > 0 && !entry.name.startsWith('.') && entry.name !== '@eaDir') {
      await collectMediaFiles(entry, depth - 1, out);
    }
  }
}

export function PhoneBackup() {
  const [service, setService] = useState('checking');
  const [device, setDevice] = useState(() => deviceLabel());
  const [editingDevice, setEditingDevice] = useState(false);
  const [run, setRun] = useState(null); // {state, total, done, skippedLedger, skippedNas, failed[], bytesTotal, bytesSent, current}
  const [verified, setVerified] = useState(() => backedUpCount());
  const stopRef = useRef(false);

  useEffect(() => {
    if (!hasBridgeToken()) return;
    let cancelled = false;
    (async () => {
      const s = await checkMediaService();
      if (!cancelled) setService(s);
    })();
    return () => { cancelled = true; };
  }, []);

  // Same fail-quiet contract as every NAS surface: no bridge token on this
  // device → render nothing (the LifeGallery footer names the lane honestly).
  if (!hasBridgeToken()) return null;

  const runBackup = async (files) => {
    const media = Array.from(files || []).filter(f => f && isMediaFile(f.name) && f.size > 0 && f.size <= MAX_MEDIA_BYTES);
    if (media.length === 0) return;
    // Ledger dedup FIRST: everything this device already verified is skipped
    // before a single byte moves — re-running "back up" is always cheap.
    const fresh = media.filter(f => !isBackedUp(f));
    const skippedLedger = media.length - fresh.length;
    const bytesTotal = fresh.reduce((s, f) => s + f.size, 0);
    stopRef.current = false;
    setRun({ state: 'running', total: fresh.length, done: 0, skippedLedger, skippedNas: 0, failed: [], bytesTotal, bytesSent: 0, current: '' });
    // Keep the screen awake for a long queue where the browser allows it.
    let wakeLock = null;
    try { wakeLock = await navigator.wakeLock?.request('screen'); } catch (_) { /* fine without it */ }
    let done = 0, skippedNas = 0, bytesBase = 0;
    const failed = [];
    try {
      for (const file of fresh) {
        if (stopRef.current) break;
        setRun(r => ({ ...r, current: file.name }));
        const res = await uploadMedia(file, {
          onProgress: (sent) => setRun(r => ({ ...r, bytesSent: bytesBase + sent })),
          shouldStop: () => stopRef.current,
        });
        bytesBase += file.size;
        if (res.ok) { done += 1; if (res.skipped) skippedNas += 1; }
        else if (!res.stopped) failed.push({ name: file.name, error: res.error });
        setRun(r => ({ ...r, done: done, skippedNas, failed: [...failed], bytesSent: bytesBase }));
      }
    } finally {
      try { await wakeLock?.release(); } catch (_) { /* already released */ }
    }
    setVerified(backedUpCount());
    setRun(r => ({ ...r, state: stopRef.current ? 'stopped' : 'finished', current: '' }));
  };

  const pickFolder = async () => {
    try {
      const dir = await window.showDirectoryPicker({ id: 'poetech-backup', startIn: 'pictures' });
      const handles = [];
      await collectMediaFiles(dir, 4, handles);
      const files = await Promise.all(handles.map(h => h.getFile()));
      await runBackup(files);
    } catch (_) { /* user cancelled the folder picker — no-op */ }
  };

  const running = run && run.state === 'running';
  const supportsFolderPick = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const deviceShown = device || 'my-phone';
  const btn = 'text-[0.625rem] uppercase tracking-wider px-3 py-1.5 min-h-[36px] inline-flex items-center gap-1.5 border cursor-pointer';

  return (
    <section className="bg-white border border-[#1A1815] p-4 sm:p-5 mb-4">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold flex items-center gap-1.5">
        <UiIcon name="shield" /> Phone → NAS backup · Photos &amp; videos, safe on the server you own
      </div>
      <p className="text-xs text-[#5A5751] italic mt-1 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Getting a new phone? Back this one up first. Every file streams to your NAS in resumable chunks and only counts once the NAS confirms the exact bytes — so &quot;safe to switch&quot; is verified, not assumed.
      </p>

      {service === 'needs-update' && (
        <div className="mb-3 text-[0.6875rem] text-[#B45309] bg-[#FDE7DC] border border-[#B45309] px-3 py-2">
          Your NAS photo service is reachable but running the build from before media backup. One redeploy of <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>photo_server.py</span> turns this card on — steps are in <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>infra/nas-property-photos/README.md</span>.
        </div>
      )}
      {service === 'unreachable' && (
        <div className="mb-3 text-[0.6875rem] text-[#B45309] bg-[#FDE7DC] border border-[#B45309] px-3 py-2">
          Can&apos;t reach the NAS backup service right now — nothing is lost, and nothing pretends to be backed up. Try again when the NAS is reachable.
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <label className={`${running || service !== 'ready' ? 'opacity-50 pointer-events-none ' : ''}${btn} border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838]`}>
          <UiIcon name="upload" /> Back up photos &amp; videos
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => { runBackup(e.target.files); e.target.value = ''; }} />
        </label>
        {supportsFolderPick && (
          <button type="button" disabled={running || service !== 'ready'} onClick={pickFolder} className={`${running || service !== 'ready' ? 'opacity-50 pointer-events-none ' : ''}${btn} border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4]`}><UiIcon name="folder" /> Back up a whole folder</button>
        )}
        {running && (
          <button type="button" onClick={() => { stopRef.current = true; }} className={`${btn} border-[#B85838] text-[#B85838] hover:bg-[#FAF8F4]`}><UiIcon name="stop" /> Stop</button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap text-[0.625rem] text-[#5A5751] mb-2">
        <span>Files land on the NAS under <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>phone-backup/{deviceShown}/</span></span>
        {editingDevice ? (
          <input
            autoFocus
            defaultValue={device}
            onBlur={e => { setDevice(setDeviceLabel(e.target.value)); setEditingDevice(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { setDevice(setDeviceLabel(e.currentTarget.value)); setEditingDevice(false); } if (e.key === 'Escape') setEditingDevice(false); }}
            placeholder="e.g. darrell-z-fold7"
            className="text-[0.6875rem] p-1 border border-[#E8E4DC] bg-white w-44"
          />
        ) : (
          <button type="button" onClick={() => setEditingDevice(true)} className="uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">name this phone</button>
        )}
        {verified > 0 && <span className="text-[#5A6E3D]">✓ {verified} file{verified === 1 ? '' : 's'} verified on the NAS from this device</span>}
      </div>

      {run && (
        <div className="mb-2">
          {running && (
            <>
              <div className="h-2 bg-[#FAF8F4] border border-[#E8E4DC] mb-1">
                <div className="h-full bg-[#5A6E3D]" style={{ width: `${run.bytesTotal ? Math.min(100, Math.round((run.bytesSent / run.bytesTotal) * 100)) : 100}%` }} />
              </div>
              <div className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {run.done + run.failed.length}/{run.total} files · {fmtBytes(run.bytesSent)} of {fmtBytes(run.bytesTotal)}{run.current ? ` · ${run.current}` : ''}
              </div>
            </>
          )}
          {!running && (
            <div className="text-[0.6875rem] text-[#3F5226] bg-[#F0F4EA] border border-[#5A6E3D] px-3 py-2" style={{ fontFamily: '"Fraunces", serif' }}>
              {run.state === 'stopped' ? 'Stopped — everything already sent is safe and resumes from where it left off. ' : ''}
              ✓ {run.done} verified on the NAS{run.skippedNas ? ` (${run.skippedNas} already there)` : ''}{run.skippedLedger ? ` · ${run.skippedLedger} skipped (backed up earlier)` : ''}{run.failed.length ? '' : ' · nothing failed'}
            </div>
          )}
          {run.failed.length > 0 && (
            <div className="text-[0.6875rem] text-[#7A1F1F] bg-[#FEE2E2] border border-[#7A1F1F] px-3 py-2 mt-1">
              {run.failed.length} did NOT make it (re-run to retry): {run.failed.slice(0, 5).map(f => f.name).join(', ')}{run.failed.length > 5 ? ` +${run.failed.length - 5} more` : ''}
            </div>
          )}
        </div>
      )}

      <p className="text-[0.625rem] text-[#5A5751] pt-2 border-t border-[#E8E4DC]" style={{ fontFamily: '"Fraunces", serif' }}>
        Honest limit: a web app can&apos;t reach your camera roll in the background, so this backs up what you pick, while the page is open — re-run it any time and it skips everything already safe. For automatic backup of every new shot, the Synology Photos app on this phone does that job; this card is where you back up in bulk and see the verified count before switching phones.
      </p>
    </section>
  );
}

export default PhoneBackup;
