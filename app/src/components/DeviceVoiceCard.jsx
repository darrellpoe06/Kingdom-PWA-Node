// =============================================================================
// DeviceVoiceCard — "Voice on this device (no connection needed)" (DR-0656)
// =============================================================================
// Darrell, 2026-09-25: "Can't we give everything it needs for quality without
// needing to reconnect with the nas?" This card is where that is done: the
// Piper voice the NAS reads with is downloaded ONCE onto this device, and a
// Sample speaks one sentence made entirely on the device.
//
// Everything shown is measured here, never painted:
//   * the state (ready / downloadable / not supported, with the reason) is
//     read from this device's own capabilities and Cache Storage;
//   * the size comes from the hosts (HEAD), then from the bytes received;
//   * the speed is timed on THIS device when Sample is pressed, and judged by
//     speedVerdict (lib/device-voice.js).
// It does NOT change what the reader uses. Wiring it in waits on the
// clip-queue / read-aloud work landing (DR-0656 Decision §4).
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  checkDeviceVoice, downloadDeviceVoice, synthesizeOnDevice, measureDownloadSize,
  removeDeviceVoice, releaseDeviceVoice, speedVerdict, mb, DEVICE_VOICES,
} from '../lib/device-voice.js';

// KJV John 1:1, verbatim from public/bible/kjv/John.json.
export const DEVICE_SAMPLE = 'In the beginning was the Word, and the Word was with God, and the Word was God.';
const RTF_KEY = 'poetech.deviceVoice.rtf';

function readRtf(voice) {
  try { const v = Number(localStorage.getItem(`${RTF_KEY}.${voice}`)); return v > 0 ? v : null; } catch (_) { return null; }
}
function writeRtf(voice, v) {
  try { localStorage.setItem(`${RTF_KEY}.${voice}`, String(v)); } catch (_) { /* per-viewer convenience only */ }
}

const BTN = 'text-[0.6875rem] uppercase tracking-wider px-3 py-2 border focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] disabled:opacity-50';

export default function DeviceVoiceCard() {
  const [voice, setVoice] = useState('male');
  const [status, setStatus] = useState(null); // checkDeviceVoice result
  const [size, setSize] = useState(undefined); // undefined = asking, null = host did not say
  const [progress, setProgress] = useState(null); // { loaded, total }
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [sample, setSample] = useState(null); // { ms, audioSeconds, initMs }
  const [rtf, setRtf] = useState(() => readRtf('male'));
  const audioRef = useRef(null);

  const refresh = useCallback(async (v) => {
    const s = await checkDeviceVoice({ voice: v });
    setStatus(s);
    if (s.state === 'downloadable') {
      setSize(undefined);
      setSize(await measureDownloadSize({ voice: v }));
    }
  }, []);

  useEffect(() => {
    setSample(null); setError(''); setRtf(readRtf(voice));
    refresh(voice);
  }, [voice, refresh]);

  useEffect(() => () => {
    if (audioRef.current) { try { audioRef.current.pause(); } catch (_) { /* gone */ } }
    releaseDeviceVoice();
  }, []);

  const download = async () => {
    setBusy('download'); setError(''); setProgress({ loaded: 0, total: size || 0, exact: !!size });
    const r = await downloadDeviceVoice({ voice, expectedBytes: size || undefined, onProgress: (p) => setProgress(p) });
    setBusy('');
    if (r.error) setError(`The download stopped (${r.error}). Nothing half-finished was kept; press Download to try again.`);
    setProgress(null);
    refresh(voice);
  };

  const speak = async () => {
    setBusy('sample'); setError('');
    const r = await synthesizeOnDevice({ text: DEVICE_SAMPLE, voice });
    setBusy('');
    if (r.error) { setError(`The device could not speak (${r.error}).`); refresh(voice); return; }
    setSample(r);
    const measured = r.ms / 1000 / r.audioSeconds;
    setRtf(measured); writeRtf(voice, measured);
    try {
      if (audioRef.current) audioRef.current.pause();
      const a = new Audio(r.url);
      audioRef.current = a;
      a.onended = () => URL.revokeObjectURL(r.url);
      await a.play();
    } catch (_) { /* the clip exists; autoplay policy only */ }
  };

  const remove = async () => {
    releaseDeviceVoice();
    await removeDeviceVoice({ voice });
    setSample(null);
    refresh(voice);
  };

  const state = status ? status.state : 'checking';
  // A percentage only against a size the host declared up front; otherwise
  // bytes received, never a "100%" computed against a partial total.
  const pct = progress && progress.exact && progress.total ? Math.min(100, Math.floor((progress.loaded / progress.total) * 100)) : null;
  const verdict = speedVerdict(rtf);

  return (
    <div className="border border-[#1A1815] bg-white p-4" data-testid="device-voice-card">
      <div className="text-sm font-semibold text-[#1A1815]">Voice on this device (no connection needed)</div>
      <p className="text-[0.75rem] text-[#5A5751] mt-1">
        The same reading voice the home server uses, kept on this phone or computer. Download it once; after that it speaks with no connection at all.
      </p>

      <div className="flex flex-wrap gap-1 mt-3" role="group" aria-label="Which voice">
        {Object.entries(DEVICE_VOICES).map(([key, v]) => (
          <button key={key} type="button" aria-pressed={voice === key} onClick={() => setVoice(key)} disabled={!!busy}
            className={`${BTN} ${voice === key ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}>
            {v.label}
          </button>
        ))}
      </div>

      <p className="text-[0.75rem] mt-3" data-testid="device-voice-state">
        <span className="font-semibold text-[#1A1815]">
          {state === 'ready' ? 'On this device.' : state === 'downloadable' ? 'Not downloaded yet.' : state === 'unsupported' ? 'Not supported on this device.' : 'Checking this device…'}
        </span>{' '}
        <span className="text-[#5A5751]">{status ? status.reason : ''}</span>
      </p>

      {state === 'downloadable' && (
        <div className="mt-3">
          <button type="button" onClick={download} disabled={!!busy} data-testid="device-voice-download"
            className={`${BTN} bg-[#1A1815] text-white border-[#1A1815] hover:bg-[#B85838] hover:border-[#B85838]`}>
            {busy === 'download' ? 'Downloading…' : 'Download the voice to this device'}
          </button>
          <p className="text-[0.6875rem] text-[#5A5751] mt-1" data-testid="device-voice-size">
            {size === undefined ? 'Asking how big it is…' : size ? `Size: ${mb(size)}, downloaded once. Use Wi-Fi if data is limited.` : 'The size shows as soon as the download starts.'}
          </p>
        </div>
      )}

      {progress && (
        <div className="mt-2" data-testid="device-voice-progress">
          <div className="h-2 bg-[#E8E4DC] overflow-hidden" role="progressbar" aria-label="Voice download" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
            <div className={`h-2 bg-[#1A1815] ${pct === null ? 'animate-pulse' : ''}`} style={{ width: pct === null ? '100%' : `${pct}%` }} />
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mt-1">
            {pct === null ? `${mb(progress.loaded)} received so far` : `${mb(progress.loaded)} of ${mb(progress.total)} (${pct}%)`}
          </p>
        </div>
      )}

      {state === 'ready' && (
        <div className="mt-3">
          <p className="text-[0.6875rem] text-[#5A5751]">Kept on this device: {status.cached && status.cached.bytes ? mb(status.cached.bytes) : 'yes'}.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button type="button" onClick={speak} disabled={!!busy} data-testid="device-voice-sample"
              className={`${BTN} bg-[#1A1815] text-white border-[#1A1815] hover:bg-[#B85838] hover:border-[#B85838]`}>
              {busy === 'sample' ? 'Making the sentence…' : '▶ Sample'}
            </button>
            <button type="button" onClick={remove} disabled={!!busy}
              className={`${BTN} border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`}>
              Remove from this device
            </button>
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mt-2 italic">“{DEVICE_SAMPLE}” (John 1:1, KJV)</p>
          {sample && (
            <p className="text-[0.6875rem] text-[#1A1815] mt-1" data-testid="device-voice-timing">
              Made on this device in {(sample.ms / 1000).toFixed(1)} s for {sample.audioSeconds.toFixed(1)} s of speech
              {sample.initMs ? ` (the first time also loads the voice: ${(sample.initMs / 1000).toFixed(1)} s)` : ''}.
            </p>
          )}
          <p className={`text-[0.6875rem] mt-1 ${verdict.level === 'slow' ? 'text-[#B85838]' : 'text-[#5A5751]'}`} data-testid="device-voice-speed">{verdict.text}</p>
        </div>
      )}

      {error && <p className="text-[0.6875rem] text-[#B85838] mt-2" role="alert">{error}</p>}

      <p className="text-[0.625rem] text-[#5A5751] mt-3 border-t border-[#E8E4DC] pt-2">
        The reader does not use this voice yet; lessons still read the way they do today. This card is where it is downloaded and tried.
      </p>
    </div>
  );
}
