// =============================================================================
// WorkflowScribe — the Scribe surface: record a workflow on screen, or a whole
// meeting/conversation (30min–1hr+), inside PoeTech.
// =============================================================================
// Darrell 2026-07-27. Reality-trace (DR-0061): this surface reads/writes REAL
// state — the live MediaStream, the real recorded Blob and its chunk list, the
// real step markers, and the real session manifest. Upload goes to the
// same-origin sovereign /scribe/* route (infra/nas-scribe/scribe_ingest_server.py
// behind Caddy). Until that server is deployed on the NAS, the upload reports
// its true failure and the steward downloads the recording + manifest locally —
// nothing here paints success it didn't earn (DR-0076).
//
// Consent is the front door, not a footnote: a meeting will not start until
// every named party consents (all-party posture, 720 ILCS 5/14); a workflow
// requires the operator's own confirmation. The live indicator is AMBER —
// true red is reserved (Color Theology, DR-0099).
import { useState } from 'react';
import { formatDuration } from '../lib/voice-recording.js';
import {
  useWorkflowScribe, buildConsent, createChunkUploader,
  SCRIBE_MAX_DURATION_MIN,
} from '../lib/workflow-scribe.js';

const box = 'rounded-xl border border-[#E5E0D8] bg-white p-4';
const btn = 'px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed';

export function WorkflowScribe({ isSteward = false }) {
  const scribe = useWorkflowScribe();
  const [kind, setKind] = useState('workflow');
  const [parties, setParties] = useState([{ name: '', consented: false }]);
  const [stepLabel, setStepLabel] = useState('');
  const [upload, setUpload] = useState({ state: 'idle', message: '' });

  const consent = buildConsent(parties);
  const supported = kind === 'workflow' ? scribe.screenSupported : scribe.micSupported;

  const setParty = (i, patch) => setParties((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const uploadSession = async () => {
    const { manifest, chunks } = scribe.result || {};
    if (!manifest) return;
    setUpload({ state: 'uploading', message: 'Uploading to the sovereign ingest…' });
    try {
      const res = await fetch('/scribe/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: manifest.sessionId, kind: manifest.kind, consent: manifest.consent }),
      });
      if (!res.ok) throw new Error(`session http-${res.status}`);
      const uploader = createChunkUploader({ endpoint: '/scribe' });
      for (let i = 0; i < chunks.length; i += 1) {
        const put = await uploader.put({ sessionId: manifest.sessionId, index: i, track: 'main' }, chunks[i]);
        if (!put.ok) throw new Error(`chunk ${i}: ${put.error}`);
        setUpload({ state: 'uploading', message: `Uploading chunk ${i + 1} of ${chunks.length}…` });
      }
      const done = await fetch('/scribe/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: manifest.sessionId, manifest }),
      });
      if (!done.ok) throw new Error(`complete http-${done.status}`);
      setUpload({ state: 'done', message: 'Uploaded and queued for transcription on the NAS.' });
    } catch (e) {
      setUpload({
        state: 'failed',
        message: `Sovereign ingest not reachable (${e && e.message}). The /scribe route deploys with the NAS server — download the recording and manifest below so nothing is lost.`,
      });
    }
  };

  const manifestUrl = scribe.result
    ? `data:application/json,${encodeURIComponent(JSON.stringify(scribe.result.manifest, null, 2))}`
    : '';

  // Steward gate lives INSIDE the surface (Academy pattern) so the monolith
  // seam stays minimal; the nav spread already hides the tab for non-stewards.
  if (!isSteward) {
    return (
      <div className={`${box} max-w-2xl mx-auto mt-6 text-center`}>
        <p className="text-sm text-[#1A1815] font-semibold">Scribe is a stewardship space.</p>
        <p className="text-xs text-[#5A5751] mt-1.5 leading-relaxed">Recording workflows and meetings is steward-only for now. Sign in with a family/governor account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className={box}>
        <h2 className="text-lg font-bold text-[#1A1815]">Scribe</h2>
        <p className="text-sm text-[#5A5751] mt-1">
          Record a workflow on your screen (step markers become the how-to guide), or record a whole
          meeting or conversation for transcription and minutes. Self-stops at {SCRIBE_MAX_DURATION_MIN} minutes.
        </p>
        <div className="flex gap-2 mt-3">
          {[['workflow', 'Workflow on screen'], ['meeting', 'Meeting / conversation']].map(([k, label]) => (
            <button key={k} type="button" disabled={scribe.recording}
              className={`${btn} border ${kind === k ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#1A1815] border-[#E5E0D8]'}`}
              onClick={() => setKind(k)}>{label}</button>
          ))}
        </div>
        {!supported && (
          <p className="text-sm text-amber-700 mt-2">
            {kind === 'workflow'
              ? 'Screen capture is not supported in this browser — workflow recording needs a desktop browser (Chrome/Edge/Safari).'
              : 'Microphone recording is not supported in this browser.'}
          </p>
        )}
      </div>

      <div className={box}>
        <h3 className="font-semibold text-[#1A1815]">
          {kind === 'meeting' ? 'Consent — every person being recorded' : 'Consent — the operator'}
        </h3>
        <p className="text-xs text-[#5A5751] mt-1">
          {kind === 'meeting'
            ? 'Illinois requires ALL parties to consent to recording a private conversation. Name each person; recording cannot start until every box is checked.'
            : 'Confirm you are the one recording this screen and consent to the capture.'}
        </p>
        {parties.map((p, i) => (
          <div key={i} className="flex items-center gap-2 mt-2">
            <input value={p.name} placeholder="Name" disabled={scribe.recording}
              className="border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-sm flex-1"
              onChange={(e) => setParty(i, { name: e.target.value })} />
            <label className="flex items-center gap-1.5 text-sm text-[#1A1815]">
              <input type="checkbox" checked={p.consented} disabled={scribe.recording}
                onChange={(e) => setParty(i, { consented: e.target.checked })} />
              consents
            </label>
          </div>
        ))}
        {kind === 'meeting' && !scribe.recording && (
          <button type="button" className={`${btn} mt-2 border border-[#E5E0D8] bg-white text-[#1A1815]`}
            onClick={() => setParties((ps) => [...ps, { name: '', consented: false }])}>
            + Add person
          </button>
        )}
      </div>

      <div className={box}>
        <div className="flex items-center gap-3">
          {!scribe.recording ? (
            <button type="button" className={`${btn} bg-[#1A1815] text-white`}
              disabled={!supported || !consent.allConsented}
              onClick={() => { setUpload({ state: 'idle', message: '' }); scribe.start({ kind, consent }); }}>
              Start recording
            </button>
          ) : (
            <button type="button" className={`${btn} bg-amber-600 text-white`} onClick={scribe.stop}>
              Stop
            </button>
          )}
          {scribe.recording && (
            <span className="flex items-center gap-2 text-sm font-semibold text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
              RECORDING {formatDuration(scribe.seconds)}
            </span>
          )}
          {!scribe.recording && !consent.allConsented && (
            <span className="text-xs text-[#5A5751]">Complete consent above to enable recording.</span>
          )}
        </div>
        {scribe.error && <p className="text-sm text-amber-700 mt-2">Could not start: {scribe.error}</p>}

        {kind === 'workflow' && scribe.recording && (
          <div className="flex items-center gap-2 mt-3">
            <input value={stepLabel} placeholder="What did you just do? (step label)"
              className="border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-sm flex-1"
              onChange={(e) => setStepLabel(e.target.value)} />
            <button type="button" className={`${btn} border border-[#E5E0D8] bg-white text-[#1A1815]`}
              onClick={() => { if (scribe.markStep(stepLabel)) setStepLabel(''); }}>
              Mark step
            </button>
          </div>
        )}
        {scribe.steps.length > 0 && (
          <ol className="mt-3 space-y-1 text-sm text-[#1A1815]">
            {scribe.steps.map((s) => (
              <li key={s.index}>
                <span className="font-mono text-xs text-[#5A5751] mr-2">{formatDuration(s.atSeconds)}</span>
                {s.index}. {s.label}
              </li>
            ))}
          </ol>
        )}
      </div>

      {scribe.result && (
        <div className={box}>
          <h3 className="font-semibold text-[#1A1815]">Recorded session</h3>
          {scribe.result.manifest.kind === 'workflow'
            ? <video className="w-full rounded-lg mt-2" src={scribe.result.url} controls />
            : <audio className="w-full mt-2" src={scribe.result.url} controls />}
          <p className="text-xs text-[#5A5751] mt-2">
            {formatDuration(scribe.result.manifest.seconds)} · {scribe.result.manifest.chunkCount} chunk(s) ·
            {' '}{scribe.result.manifest.steps.length} step marker(s)
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" className={`${btn} bg-[#1A1815] text-white`}
              disabled={upload.state === 'uploading' || upload.state === 'done'} onClick={uploadSession}>
              {upload.state === 'done' ? 'Uploaded' : 'Upload to NAS for transcription'}
            </button>
            <a className={`${btn} border border-[#E5E0D8] bg-white text-[#1A1815]`}
              href={scribe.result.url} download={`${scribe.result.manifest.sessionId}.webm`}>
              Download recording
            </a>
            <a className={`${btn} border border-[#E5E0D8] bg-white text-[#1A1815]`}
              href={manifestUrl} download={`${scribe.result.manifest.sessionId}.manifest.json`}>
              Download manifest
            </a>
          </div>
          {upload.message && (
            <p className={`text-sm mt-2 ${upload.state === 'failed' ? 'text-amber-700' : 'text-[#1A1815]'}`}>
              {upload.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkflowScribe;
